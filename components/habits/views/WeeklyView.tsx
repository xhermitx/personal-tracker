'use client';

import { useState } from 'react';
import { Habit, HabitLog } from '@/types';
import {
  getWeekStart, getWeekDays, toDateStr, addDays, today,
  formatDuration, formatDurationFull, formatTime,
} from '@/lib/dateUtils';

function displayValue(habit: Habit, log?: HabitLog): string {
  if (!log) return '—';
  if (habit.type === 'duration') {
    const m = Number(log.value);
    return m > 0 ? formatDuration(m) : '—';
  }
  if (habit.type === 'time') return log.value ? formatTime(String(log.value)) : '—';
  if (habit.type === 'yesno') return log.value ? '✓' : '—';
  const n = Number(log.value);
  if (!n) return '—';
  return `${n}${habit.unit ? ` ${habit.unit}` : ''}`;
}

function hasValue(habit: Habit, log?: HabitLog): boolean {
  if (!log) return false;
  if (habit.type === 'yesno') return !!log.value;
  if (habit.type === 'duration' || habit.type === 'number') return Number(log.value) > 0;
  return !!log.value;
}

function getDailyProductionMins(habits: Habit[], logs: HabitLog[], date: string): number {
  return habits
    .filter(h => h.isProductionSprint && h.type === 'duration' && !h.archived)
    .reduce((sum, h) => {
      const log = logs.find(l => l.habitId === h.id && l.date === date);
      return sum + (log ? Number(log.value) : 0);
    }, 0);
}

interface Props {
  habits: Habit[];
  logs: HabitLog[];
}

export default function WeeklyView({ habits, logs }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const days = getWeekDays(weekStart);
  const todayStr = today();
  const activeHabits = habits.filter(h => !h.archived).sort((a, b) => a.order - b.order);
  const hasProd = activeHabits.some(h => h.isProductionSprint);

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, 7));

  const weekLabel = () => {
    const s = days[0];
    const e = days[6];
    const sStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const eStr = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${sStr} – ${eStr}`;
  };

  if (activeHabits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📅</div>
        <p className="empty-state-text">Define habits first in the Daily view.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="date-nav-btn" onClick={prevWeek}>←</button>
        <span className="date-nav-label" style={{ fontSize: '0.9rem' }}>{weekLabel()}</span>
        <button className="date-nav-btn" onClick={nextWeek}>→</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(getWeekStart(new Date()))}>
          This Week
        </button>
      </div>

      <div className="weekly-grid-wrapper">
        <table className="weekly-grid">
          <thead>
            <tr>
              <th>Habit</th>
              {days.map(d => {
                const ds = toDateStr(d);
                const isToday = ds === todayStr;
                return (
                  <th key={ds} className={isToday ? 'today-col' : ''}>
                    <div>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: 2 }}>{d.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {activeHabits.map(habit => (
              <tr key={habit.id}>
                <td>
                  <div className="weekly-habit-name">
                    <div className="weekly-habit-icon" style={{ background: `${habit.color}18` }}>
                      {habit.icon}
                    </div>
                    <span style={{ fontSize: '0.8rem' }}>{habit.name}</span>
                    {habit.isProductionSprint && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700 }}>🔥</span>
                    )}
                  </div>
                </td>
                {days.map(d => {
                  const ds = toDateStr(d);
                  const log = logs.find(l => l.habitId === habit.id && l.date === ds);
                  const val = displayValue(habit, log);
                  const logged = hasValue(habit, log);
                  const isToday = ds === todayStr;
                  return (
                    <td key={ds}>
                      <span
                        className={`weekly-cell-val${isToday ? ' today-val' : ''}`}
                        style={logged ? { color: habit.color, fontWeight: 700 } : { color: 'var(--text-muted)' }}
                      >
                        {val}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Production total row */}
            {hasProd && (
              <tr className="weekly-total-row">
                <td>
                  <div className="weekly-habit-name">
                    <span>🔥</span>
                    <span>Production Total</span>
                  </div>
                </td>
                {days.map(d => {
                  const ds = toDateStr(d);
                  const mins = getDailyProductionMins(activeHabits, logs, ds);
                  return (
                    <td key={ds}>{mins > 0 ? formatDuration(mins) : '—'}</td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Week summary stats */}
      {hasProd && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {days.map(d => {
            const ds = toDateStr(d);
            const mins = getDailyProductionMins(activeHabits, logs, ds);
            if (!mins) return null;
            return (
              <div key={ds} style={{
                padding: '10px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {formatDuration(mins)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
