'use client';

import { useState } from 'react';
import { Habit, HabitLog } from '@/types';
import HabitDefinitionModal from './HabitDefinitionModal';
import DailyView from './views/DailyView';
import WeeklyView from './views/WeeklyView';
import MonthlyView from './views/MonthlyView';
import AnalyticsView from './views/AnalyticsView';

type View = 'daily' | 'weekly' | 'monthly' | 'analytics' | 'manage';

const VIEWS: { key: View; label: string; icon: string }[] = [
  { key: 'daily',     label: 'Daily',     icon: '📋' },
  { key: 'weekly',    label: 'Weekly',    icon: '📅' },
  { key: 'monthly',   label: 'Monthly',   icon: '🗓️' },
  { key: 'analytics', label: 'Analytics', icon: '📊' },
  { key: 'manage',    label: 'Habits',    icon: '⚙️' },
];

interface Props {
  userId: string;
  habits: Habit[];
  logs: HabitLog[];
  onAddHabit: (data: Omit<Habit, 'id' | 'createdAt'>) => void;
  onUpdateHabit: (id: string, updates: Partial<Habit>) => void;
  onDeleteHabit: (id: string) => void;
  onUpsertLog: (log: Omit<HabitLog, 'id' | 'createdAt'>) => void;
}

export default function HabitTracker({
  userId, habits, logs,
  onAddHabit, onUpdateHabit, onDeleteHabit, onUpsertLog,
}: Props) {
  const [view, setView] = useState<View>('daily');
  const [showDefineModal, setShowDefineModal] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  const activeHabits = habits.filter(h => !h.archived).sort((a, b) => a.order - b.order);
  const archivedHabits = habits.filter(h => h.archived);
  const nextOrder = habits.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* View selector */}
      <div className="view-tabs">
        {VIEWS.map(v => (
          <button key={v.key} className={`view-tab${view === v.key ? ' active' : ''}`}
            onClick={() => setView(v.key)}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* View content */}
      {view === 'daily' && (
        <DailyView
          userId={userId} habits={activeHabits} logs={logs}
          onUpsert={onUpsertLog}
          onAddHabit={() => setShowDefineModal(true)}
        />
      )}
      {view === 'weekly' && (
        <WeeklyView habits={activeHabits} logs={logs} />
      )}
      {view === 'monthly' && (
        <MonthlyView habits={activeHabits} logs={logs} />
      )}
      {view === 'analytics' && (
        <AnalyticsView habits={activeHabits} logs={logs} />
      )}
      {view === 'manage' && (
        <ManageHabits
          activeHabits={activeHabits}
          archivedHabits={archivedHabits}
          logs={logs}
          onAdd={() => setShowDefineModal(true)}
          onEdit={h => setEditHabit(h)}
          onArchive={h => onUpdateHabit(h.id, { archived: !h.archived })}
          onDelete={h => { if (confirm(`Delete "${h.name}"? All logs will be removed.`)) onDeleteHabit(h.id); }}
        />
      )}

      {/* Modals */}
      {showDefineModal && (
        <HabitDefinitionModal
          userId={userId}
          nextOrder={nextOrder}
          onClose={() => setShowDefineModal(false)}
          onSave={(data) => { onAddHabit(data); setShowDefineModal(false); }}
        />
      )}
      {editHabit && (
        <HabitDefinitionModal
          initial={editHabit}
          userId={userId}
          nextOrder={nextOrder}
          onClose={() => setEditHabit(null)}
          onSave={(data) => { onUpdateHabit(editHabit.id, data); setEditHabit(null); }}
        />
      )}
    </div>
  );
}

// ── Manage Habits Panel ────────────────────────────────────────────────────

interface ManageProps {
  activeHabits: Habit[];
  archivedHabits: Habit[];
  logs: HabitLog[];
  onAdd: () => void;
  onEdit: (h: Habit) => void;
  onArchive: (h: Habit) => void;
  onDelete: (h: Habit) => void;
}

function ManageHabits({ activeHabits, archivedHabits, logs, onAdd, onEdit, onArchive, onDelete }: ManageProps) {
  const TYPE_LABELS: Record<string, string> = {
    duration: '⏱️ Duration',
    time: '🕐 Clock Time',
    number: '🔢 Number',
    yesno: '✅ Yes / No',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>Manage Habits</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
            Define, edit, and configure which habits to track daily.
          </div>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>+ Define Habit</button>
      </div>

      {activeHabits.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <p className="empty-state-text">No habits defined yet.</p>
          <button className="btn btn-primary" onClick={onAdd}>+ Define First Habit</button>
        </div>
      )}

      <div className="habit-settings-list">
        {activeHabits.map(habit => {
          const logCount = logs.filter(l => l.habitId === habit.id).length;
          return (
            <div key={habit.id} className="habit-settings-row">
              <div className="habit-settings-icon" style={{ background: `${habit.color}18` }}>
                {habit.icon}
              </div>
              <div className="habit-settings-info">
                <div className="habit-settings-name">{habit.name}</div>
                <div className="habit-settings-meta">
                  {TYPE_LABELS[habit.type]}
                  {habit.type === 'number' && habit.unit && ` · ${habit.unit}`}
                  {' · '}{logCount} log{logCount !== 1 ? 's' : ''}
                </div>
              </div>
              {habit.isProductionSprint && (
                <span className="production-badge">🔥 Production</span>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onEdit(habit)} title="Edit">✏️</button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onArchive(habit)} title="Archive">📦</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(habit)} title="Delete">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      {archivedHabits.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Archived
          </div>
          <div className="habit-settings-list">
            {archivedHabits.map(habit => (
              <div key={habit.id} className="habit-settings-row" style={{ opacity: 0.5 }}>
                <div className="habit-settings-icon">{habit.icon}</div>
                <div className="habit-settings-info">
                  <div className="habit-settings-name" style={{ textDecoration: 'line-through' }}>{habit.name}</div>
                  <div className="habit-settings-meta">{TYPE_LABELS[habit.type]} · Archived</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => onArchive(habit)}>Restore</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(habit)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
