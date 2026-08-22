'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, User, Task, Habit, HabitLog, TaskGroup } from '@/types';

const STORAGE_KEY = 'personal-tracker-data-v2';

const initialState: AppState = {
  users: [],
  tasks: [],
  habits: [],
  habitLogs: [],
};

interface AppContextValue {
  state: AppState;
  // Users
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  // Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, group: TaskGroup) => void;
  // Habit definitions
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => string;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (userId: string, orderedIds: string[]) => void;
  // Habit logs (one per habit per day)
  upsertHabitLog: (log: Omit<HabitLog, 'id' | 'createdAt'>) => void;
  deleteHabitLog: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        setState({ ...initialState, ...parsed });
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loaded]);

  // ── Users ──────────────────────────────────────────────────
  const addUser = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      users: [...prev.users, { ...user, id: generateId(), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u),
    }));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id),
      tasks: prev.tasks.filter(t => t.userId !== id),
      habits: prev.habits.filter(h => h.userId !== id),
      habitLogs: prev.habitLogs.filter(l => l.userId !== id),
    }));
  }, []);

  // ── Tasks ──────────────────────────────────────────────────
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, { ...task, id: generateId(), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  }, []);

  const moveTask = useCallback((id: string, group: TaskGroup) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, group } : t),
    }));
  }, []);

  // ── Habits (definitions) ───────────────────────────────────
  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt'>): string => {
    const id = generateId();
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { ...habit, id, createdAt: new Date().toISOString() }],
    }));
    return id;
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h),
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
      habitLogs: prev.habitLogs.filter(l => l.habitId !== id),
    }));
  }, []);

  const reorderHabits = useCallback((userId: string, orderedIds: string[]) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => {
        if (h.userId !== userId) return h;
        const idx = orderedIds.indexOf(h.id);
        return idx >= 0 ? { ...h, order: idx } : h;
      }),
    }));
  }, []);

  // ── Habit Logs ─────────────────────────────────────────────
  const upsertHabitLog = useCallback((log: Omit<HabitLog, 'id' | 'createdAt'>) => {
    setState(prev => {
      const existing = prev.habitLogs.find(
        l => l.userId === log.userId && l.habitId === log.habitId && l.date === log.date
      );
      if (existing) {
        return {
          ...prev,
          habitLogs: prev.habitLogs.map(l =>
            l.id === existing.id ? { ...l, ...log } : l
          ),
        };
      }
      return {
        ...prev,
        habitLogs: [...prev.habitLogs, { ...log, id: generateId(), createdAt: new Date().toISOString() }],
      };
    });
  }, []);

  const deleteHabitLog = useCallback((id: string) => {
    setState(prev => ({ ...prev, habitLogs: prev.habitLogs.filter(l => l.id !== id) }));
  }, []);

  if (!loaded) return null;

  return (
    <AppContext.Provider value={{
      state,
      addUser, updateUser, deleteUser,
      addTask, updateTask, deleteTask, moveTask,
      addHabit, updateHabit, deleteHabit, reorderHabits,
      upsertHabitLog, deleteHabitLog,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
