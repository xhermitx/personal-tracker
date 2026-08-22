'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import HabitTracker from '@/components/habits/HabitTracker';
import { Habit, HabitLog } from '@/types';

export default function HabitsPage() {
  const { state, addHabit, updateHabit, deleteHabit, upsertHabitLog } = useApp();
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const user = state.users.find(u => u.id === userId);
  if (!user) return null;

  if (!user.modules.includes('habits')) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-state-icon">🌱</div>
        <p className="empty-state-text">Habit Tracker is not enabled for this user.</p>
        <button className="btn btn-ghost" onClick={() => router.push('/admin')}>
          Enable in Settings →
        </button>
      </div>
    );
  }

  const userHabits = state.habits
    .filter(h => h.userId === userId)
    .sort((a, b) => a.order - b.order);

  const userLogs = state.habitLogs.filter(l => l.userId === userId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🌱 Habit Tracker</h1>
          <p className="page-subtitle">Track your daily habits, sprints, and build streaks.</p>
        </div>
      </div>

      <HabitTracker
        userId={userId}
        habits={userHabits}
        logs={userLogs}
        onAddHabit={(data) => addHabit(data)}
        onUpdateHabit={updateHabit}
        onDeleteHabit={deleteHabit}
        onUpsertLog={(log) => upsertHabitLog(log)}
      />
    </div>
  );
}
