'use client';

import { useState } from 'react';
import { Habit, HabitLog } from '@/types';
import { getMonthCalendar, toDateStr, today, formatDuration, formatTime } from '@/lib/dateUtils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDailyProductionMins(habits: Habit[], logs: HabitLog[], date: string): number {
  return habits
    .filter(h => h.isProductionSprint && h.type === 'duration' && !h.archived)
    .reduce((sum, h) => {
      const log = logs.find(l => l.habitId === h.id && l.date === date);
      return sum + (log ? Number(log.value) : 0);
    }, 0);
}

function displayValue(habit: Habit, log?: HabitLog): string {
  if (!log) return '—';
  if (habit.type === 'duration') { const m = Number(log.value); return m > 0 ? formatDuration(m) : '—'; }
  if (habit.type === 'time') return log.value ? formatTime(String(log.value)) : '—';
  if (habit.type === 'yesno') return log.value ? '✓' : '—';
  const n = Number(log.value); return n ? `${n}${habit.unit ? ' ' + habit.unit : ''}` : '—';
}

interface Props {
  habits: Habit[];
  logs: HabitLog[];
}

export default function MonthlyView({ habits, logs }: Props) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = today();
  const calendar = getMonthCalendar(year, month);
  const activeHabits = habits.filter(h => !h.archived).sort((a, b) => a.order - b.order);
  const hasProd = activeHabits.some(h => h.isProductionSprint);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Monthly totals
  const monthDates = calendar.flat().filter(Boolean) as Date[];
  const monthlyProdMins = monthDates.reduce((sum, d) => sum + getDailyProductionMins(activeHabits, logs, toDateStr(d)), 0);
  const loggedDays = monthDates.filter(d => {
    const ds = toDateStr(d);
    return activeHabits.some(h => {
      const log = logs.find(l => l.habitId === h.id && l.date === ds);
      if (!log) return false;
      if (h.type === 'yesno') return !!log.value;
      return Number(log.value) > 0 || !!log.value;
    });
  }).length;

  const selectedDayLogs = selectedDate
    ? activeHabits.map(h => ({ habit: h, log: logs.find(l => l.habitId === h.id && l.date === selectedDate) }))
      .filter(({ log }) => log !== undefined)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="date-nav-btn" onClick={prevMonth}>←</button>
          <span className="month-title">{monthLabel}</span>
          <button className="date-nav-btn" onClick={nextMonth}>→</button>
        </div>

        {/* Monthly summary pills */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', fontSize: '0.78rem' }}>
            📅 <strong style={{ color: 'var(--accent)' }}>{loggedDays}</strong> logged days
          </div>
          {hasProd && monthlyProdMins > 0 && (
            <div style={{ padding: '6px 14px', background: 'var(--accent-light)', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', color: 'var(--accent)' }}>
              🔥 <strong>{formatDuration(monthlyProdMins)}</strong> total production
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
        <table className="month-grid">
          <thead>
            <tr>
              {WEEKDAYS.map(d => <th key={d}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {calendar.map((week, wi) => (
              <tr key={wi}>
                {week.map((date, di) => {
                  if (!date) return <td key={di} className="month-cell empty" />;
                  const ds = toDateStr(date);
                  const isToday = ds === todayStr;
                  const isSelected = ds === selectedDate;
                  const prodMins = getDailyProductionMins(activeHabits, logs, ds);
                  const loggedHabits = activeHabits.filter(h => {
                    const log = logs.find(l => l.habitId === h.id && l.date === ds);
                    if (!log) return false;
                    return h.type === 'yesno' ? !!log.value : Number(log.value) > 0 || !!log.value;
                  });
                  return (
                    <td key={ds} className="month-cell"
                      onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}>
                      <div className={`month-cell-inner${isToday ? ' today-cell' : ''}${isSelected ? ' today-cell' : ''}`}
                        style={isSelected && !isToday ? { borderColor: 'var(--blue)', background: 'rgba(78,205,196,0.08)' } : {}}>
                        <div className="month-day-num">{date.getDate()}</div>
                        {prodMins > 0 && (
                          <div className="month-prod-time">{formatDuration(prodMins)}</div>
                        )}
                        {loggedHabits.length > 0 && (
                          <div className="month-habit-dots">
                            {loggedHabits.slice(0, 6).map(h => (
                              <div key={h.id} className="month-habit-dot" style={{ background: h.color }} title={h.name} />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div className="day-detail-panel">
          <div className="day-detail-header">
            <div className="day-detail-title">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            {hasProd && (
              <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.95rem' }}>
                🔥 {formatDuration(getDailyProductionMins(activeHabits, logs, selectedDate))}
              </div>
            )}
          </div>

          {selectedDayLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.857rem', textAlign: 'center', padding: '20px 0' }}>
              No habits logged this day.
            </div>
          ) : (
            <div className="day-detail-logs">
              {selectedDayLogs.map(({ habit, log }) => (
                <div key={habit.id} className="day-detail-log-row">
                  <span className="day-detail-log-icon">{habit.icon}</span>
                  <span className="day-detail-log-name">{habit.name}</span>
                  <span className="day-detail-log-value" style={{ color: habit.color }}>
                    {displayValue(habit, log)}
                  </span>
                </div>
              ))}
              {selectedDayLogs.some(({ log }) => log?.notes) && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {selectedDayLogs.filter(({ log }) => log?.notes).map(({ habit, log }) => (
                    <div key={habit.id}>📝 <strong>{habit.name}:</strong> {log!.notes}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Monthly habit breakdown */}
      {activeHabits.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Monthly Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeHabits.map(habit => {
              const habitLogs = logs.filter(l => l.habitId === habit.id && l.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
              const logsWithValue = habitLogs.filter(l => {
                if (habit.type === 'yesno') return !!l.value;
                return Number(l.value) > 0 || !!l.value;
              });

              let summary = '';
              if (habit.type === 'duration') {
                const total = habitLogs.reduce((s, l) => s + Number(l.value), 0);
                summary = total > 0 ? formatDuration(total) : '0m';
              } else if (habit.type === 'yesno') {
                summary = `${logsWithValue.length} days`;
              } else if (habit.type === 'number') {
                const total = habitLogs.reduce((s, l) => s + Number(l.value), 0);
                summary = `${total}${habit.unit ? ' ' + habit.unit : ''}`;
              } else {
                summary = `${logsWithValue.length} entries`;
              }

              const pct = monthDates.length > 0 ? (logsWithValue.length / monthDates.length) * 100 : 0;

              return (
                <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 16 }}>{habit.icon}</span>
                  <span style={{ flex: 1, fontSize: '0.857rem', fontWeight: 500 }}>{habit.name}</span>
                  <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: habit.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: habit.color, minWidth: 60, textAlign: 'right' }}>
                    {summary}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
