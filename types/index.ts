export type ModuleType = 'todo' | 'habits';

export type TaskGroup = 'today' | 'week' | 'month';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type HabitType = 'duration' | 'time' | 'number' | 'yesno';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  color: string;
  modules: ModuleType[];
  role?: 'org' | 'member';
  orgId?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  assigneeId: string | null; // null if unassigned
  title: string;
  description: string;
  estimatedMinutes: number;
  deadline: string;
  group: TaskGroup;
  status: TaskStatus;
  scope?: 'personal' | 'org';
  createdAt: string;
  movedAt?: string;
  // History tracking
  dueDate?: string;   // YYYY-MM-DD: date it was assigned to "Today"
  dueWeek?: string;   // YYYY-WW: e.g. "2024-35"
  dueMonth?: string;  // YYYY-MM: e.g. "2024-08"
  doneAt?: string;    // ISO timestamp when status changed to 'done'
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

export interface Invite {
  id: string; // the token
  orgId: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

export interface AppState {
  users: User[];
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  invites: Invite[];
  currentOrgId: string | null;
}
