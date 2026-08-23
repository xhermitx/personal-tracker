'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState, User, Task, Habit, HabitLog, TaskGroup } from '@/types';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const initialState: AppState = {
  users: [],
  tasks: [],
  habits: [],
  habitLogs: [],
  currentOrgId: null
};

interface AppContextValue {
  state: AppState;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, group: TaskGroup) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => string;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (userId: string, orderedIds: string[]) => void;
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
    // We assume 1 Org for this app, hardcoded as 'main-org' for simplicity as requested
    const ORG_ID = 'main-org';
    setState(prev => ({ ...prev, currentOrgId: ORG_ID }));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setState(prev => ({ ...prev, users: snap.docs.map(d => d.data() as User) }));
    });
    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snap) => {
      setState(prev => ({ ...prev, tasks: snap.docs.map(d => d.data() as Task) }));
    });
    const unsubHabits = onSnapshot(collection(db, 'habits'), (snap) => {
      setState(prev => ({ ...prev, habits: snap.docs.map(d => d.data() as Habit) }));
    });
    const unsubLogs = onSnapshot(collection(db, 'habitLogs'), (snap) => {
      setState(prev => ({ ...prev, habitLogs: snap.docs.map(d => d.data() as HabitLog) }));
    });

    setLoaded(true);

    return () => {
      unsubUsers();
      unsubTasks();
      unsubHabits();
      unsubLogs();
    };
  }, []);

  const addUser = useCallback(async (user: Omit<User, 'id' | 'createdAt'>) => {
    const id = generateId();
    const newUser = { ...user, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'users', id), newUser);
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    await updateDoc(doc(db, 'users', id), updates);
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
    // Note: should also delete related tasks and habits, but keeping it simple
  }, []);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const id = generateId();
    const newTask = { ...task, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'tasks', id), newTask);
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await updateDoc(doc(db, 'tasks', id), updates);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
  }, []);

  const moveTask = useCallback(async (id: string, group: TaskGroup) => {
    await updateDoc(doc(db, 'tasks', id), { group });
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt'>): string => {
    const id = generateId();
    const newHabit = { ...habit, id, createdAt: new Date().toISOString() };
    setDoc(doc(db, 'habits', id), newHabit);
    return id;
  }, []);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    await updateDoc(doc(db, 'habits', id), updates);
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'habits', id));
  }, []);

  const reorderHabits = useCallback(async (userId: string, orderedIds: string[]) => {
    // Batch update the order for the given habits
    orderedIds.forEach((id, idx) => {
      updateDoc(doc(db, 'habits', id), { order: idx });
    });
  }, []);

  const upsertHabitLog = useCallback(async (log: Omit<HabitLog, 'id' | 'createdAt'>) => {
    // For upsert, we can query if it exists, or just generate a composite ID like userId_habitId_date
    const id = `${log.userId}_${log.habitId}_${log.date}`;
    const newLog = { ...log, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, 'habitLogs', id), newLog);
  }, []);

  const deleteHabitLog = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'habitLogs', id));
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
