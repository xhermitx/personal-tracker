export type ModuleType = 'todo' | 'habits';

export type TaskGroup = 'today' | 'week' | 'month';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type HabitType = 'duration' | 'time' | 'number' | 'yesno';

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  modules: ModuleType[];
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  assignee: string;
  estimatedMinutes: number;
  deadline: string;
  group: TaskGroup;
  status: TaskStatus;
  createdAt: string;
}

/** A habit definition — created once, logged daily */
export interface Habit {
  id: string;
  userId: string;
  name: string;
  type: HabitType;
  unit?: string;           // for 'number' type (e.g., "steps", "km")
  icon: string;
  color: string;
  isProductionSprint: boolean; // sum toward daily production time (duration only)
  order: number;
  archived: boolean;
  createdAt: string;
}

/** One log per habit per day */
export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  date: string;            // "YYYY-MM-DD"
  value: number | string | boolean;
  // duration → number (minutes)
  // time     → string "HH:MM"
  // number   → number
  // yesno    → boolean
  notes?: string;
  createdAt: string;
}

export interface AppState {
  users: User[];
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
}
