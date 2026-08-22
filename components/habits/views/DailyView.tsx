'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { Habit, HabitLog } from '@/types';
import { formatDuration, formatDurationFull, formatTime, toDateStr, fromDateStr, addDays, today } from '@/lib/dateUtils';

// ── Inline Value Inputs ────────────────────────────────────────────────────

function DurationInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const h = Math.floor((value || 0) / 60);
  const m = (value || 0) % 60;
  const [hStr, setHStr] = useState(String(h));
  const [mStr, setMStr] = useState(String(m));

  useEffect(() => { setHStr(String(Math.floor((value || 0) / 60))); setMStr(String((value || 0) % 60)); }, [value]);

  const emit = (hs: string, ms: string) =>
    onChange(Math.max(0, parseInt(hs || '0') * 60 + parseInt(ms || '0')));

  return (
    <div className="duration-input">
      <input type="number" className="form-input duration-field" min="0" max="23"
        value={hStr}
        onChange={e => { setHStr(e.target.value); emit(e.target.value, mStr); }}
        onFocus={e => e.target.select()} />
      <span className="duration-sep">h</span>
      <input type="number" className="form-input duration-field" min="0" max="59"
        value={mStr}
        onChange={e => { setMStr(e.target.value); emit(hStr, e.target.value); }}
        onFocus={e => e.target.select()} />
      <span className="duration-sep">m</span>
    </div>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="time" className="time-input" value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{ colorScheme: 'dark' }} />
  );
}

function NumberInput({ value, unit, onChange }: { value: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="number-input-wrap">
      <input type="number" className="number-input" min="0" value={value || ''}
        placeholder="0"
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        onFocus={e => e.target.select()} />
      {unit && <span className="number-unit">{unit}</span>}
    </div>
  );
}

function YesNoToggle({ value, onChange, id }: { value: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <label className="yesno-toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />
      <span className="yesno-slider" />
    </label>
  );
}

// ── Production Time Card ───────────────────────────────────────────────────

function ProductionCard({ habits, logs, date }: { habits: Habit[]; logs: HabitLog[]; date: string }) {
  const prodHabits = habits.filter(h => h.isProductionSprint && h.type === 'duration' && !h.archived);
  if (!prodHabits.length) return null;

  const totalMins = prodHabits.reduce((sum, h) => {
    const log = logs.find(l => l.habitId === h.id && l.date === date);
    return sum + (log ? Number(log.value) : 0);
  }, 0);

  const dateLabel = fromDateStr(date).toLocaleDateString('en-US',
    { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="production-card">
      <div className="production-card-header">
        <span className="production-card-icon">🔥</span>
        <div>
          <div className="production-card-label">Total Production Time</div>
          <div className="production-card-date">{dateLabel}</div>
        </div>
      </div>
      <div className="production-card-time">{formatDurationFull(totalMins)}</div>
      <div className="production-card-breakdown">
        {prodHabits.map(h => {
          const log = logs.find(l => l.habitId === h.id && l.date === date);
          const mins = log ? Number(log.value) : 0;
          return (
            <div key={h.id} className="production-breakdown-item" style={{ color: h.color }}>
              <span>{h.icon}</span>
              <span>{h.name}</span>
              <span style={{ color: mins > 0 ? h.color : 'var(--text-muted)', fontWeight: 700 }}>
                {mins > 0 ? formatDuration(mins) : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Single Habit Row ───────────────────────────────────────────────────────

function HabitRow({
  habit, log, streak, onSave,
}: {
  habit: Habit;
  log?: HabitLog;
  streak: number;
  onSave: (value: number | string | boolean, notes?: string) => void;
}) {
  const uid = useId();
  const [localVal, setLocalVal] = useState<number | string | boolean>(
    log?.value !== undefined ? log.value : getDefaultVal(habit.type)
  );
  const [notes, setNotes]       = useState(log?.notes ?? '');
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    setLocalVal(log?.value !== undefined ? log.value : getDefaultVal(habit.type));
    setNotes(log?.notes ?? '');
  }, [log, habit.type]);

  const save = useCallback((val: number | string | boolean, n?: string) => {
    onSave(val, n ?? notes);
  }, [onSave, notes]);

  const typeLabel = {
    duration: 'Duration',
    time: 'Clock time',
    number: habit.unit ? `Number (${habit.unit})` : 'Number',
    yesno: 'Yes / No',
  }[habit.type];

  const valueDisplay = () => {
    if (log?.value === undefined || log.value === '' || log.value === 0) return null;
    if (habit.type === 'duration') return formatDuration(Number(log.value));
    if (habit.type === 'time') return formatTime(String(log.value));
    if (habit.type === 'yesno') return log.value ? '✅ Done' : null;
    return `${log.value}${habit.unit ? ` ${habit.unit}` : ''}`;
  };

  const isLogged = log !== undefined && (
    habit.type === 'yesno' ? !!log.value :
    habit.type === 'duration' ? Number(log.value) > 0 :
    habit.type === 'time' ? !!log.value :
    Number(log.value) > 0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="habit-row" style={{ borderColor: isLogged ? `${habit.color}40` : undefined }}>
        {/* Icon */}
        <div className="habit-row-icon" style={{ background: `${habit.color}18` }}>
          {habit.icon}
        </div>

        {/* Name + type */}
        <div className="habit-row-info">
          <div className="habit-row-name" style={isLogged ? { color: habit.color } : {}}>
            {habit.name}
          </div>
          <div className="habit-row-type">{typeLabel}</div>
        </div>

        {/* Streak */}
        {streak >= 2 && (
          <div className="streak-badge">🔥 {streak}d</div>
        )}

        {/* Value input */}
        <div className="habit-row-input">
          {habit.type === 'duration' && (
            <DurationInput value={Number(localVal)} onChange={v => { setLocalVal(v); save(v); }} />
          )}
          {habit.type === 'time' && (
            <TimeInput value={String(localVal || '')} onChange={v => { setLocalVal(v); save(v); }} />
          )}
          {habit.type === 'number' && (
            <NumberInput value={Number(localVal)} unit={habit.unit} onChange={v => { setLocalVal(v); save(v); }} />
          )}
          {habit.type === 'yesno' && (
            <YesNoToggle id={uid} value={Boolean(localVal)} onChange={v => { setLocalVal(v); save(v); }} />
          )}
        </div>

        {/* Notes toggle */}
        <button
          className={`habit-row-notes-btn${showNotes ? ' active' : ''}`}
          onClick={() => setShowNotes(v => !v)}
          title={showNotes ? 'Hide notes' : 'Add note'}
        >
          📝
        </button>
      </div>

      {/* Notes area */}
      {showNotes && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderTop: 'none',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        }}>
          <textarea
            className="form-input"
            placeholder="Optional notes for today..."
            value={notes}
            rows={2}
            onChange={e => setNotes(e.target.value)}
            onBlur={() => save(localVal, notes)}
            style={{ fontSize: '0.78rem' }}
          />
        </div>
      )}
    </div>
  );
}

function getDefaultVal(type: string): number | string | boolean {
  if (type === 'yesno') return false;
  if (type === 'time') return '';
  return 0;
}

// ── Main Daily View ────────────────────────────────────────────────────────

interface Props {
  userId: string;
  habits: Habit[];
  logs: HabitLog[];
  onUpsert: (log: Omit<HabitLog, 'id' | 'createdAt'>) => void;
  onAddHabit: () => void;
}

export default function DailyView({ userId, habits, logs, onUpsert, onAddHabit }: Props) {
  const [date, setDate] = useState(today());
  const todayStr = today();

  const activeHabits = habits
    .filter(h => !h.archived)
    .sort((a, b) => a.order - b.order);

  const todayLogs = logs.filter(l => l.date === date);

  // Compute streak for each habit (consecutive logged days up to selected date)
  const getStreak = (habitId: string): number => {
    let d = new Date(fromDateStr(date));
    d.setDate(d.getDate() - 1); // start from yesterday
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const ds = toDateStr(d);
      const log = logs.find(l => l.habitId === habitId && l.date === ds);
      if (!log) break;
      const h = habits.find(h => h.id === habitId);
      if (!h) break;
      const hasValue = h.type === 'yesno' ? !!log.value :
        h.type === 'duration' ? Number(log.value) > 0 :
        h.type === 'time' ? !!log.value :
        Number(log.value) > 0;
      if (!hasValue) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  };

  const navLabel = () => {
    if (date === todayStr) return 'Today';
    const d = fromDateStr(date);
    const yesterday = toDateStr(addDays(new Date(), -1));
    if (date === yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const prodHabits = activeHabits.filter(h => h.isProductionSprint);
  const otherHabits = activeHabits.filter(h => !h.isProductionSprint);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Date navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="date-nav">
          <button className="date-nav-btn" onClick={() => setDate(toDateStr(addDays(fromDateStr(date), -1)))}>←</button>
          <span className="date-nav-label">{navLabel()}</span>
          <button
            className="date-nav-btn"
            onClick={() => setDate(toDateStr(addDays(fromDateStr(date), 1)))}
            disabled={date >= todayStr}
            style={{ opacity: date >= todayStr ? 0.3 : 1 }}
          >→</button>
          {date !== todayStr && (
            <button className="btn btn-ghost btn-sm" onClick={() => setDate(todayStr)}>Today</button>
          )}
        </div>
        <button className="btn btn-primary" onClick={onAddHabit}>+ Define Habit</button>
      </div>

      {/* Production time card */}
      {prodHabits.length > 0 && (
        <ProductionCard habits={activeHabits} logs={todayLogs} date={date} />
      )}

      {/* No habits at all */}
      {activeHabits.length === 0 && (
        <div className="empty-state" style={{ marginTop: 48 }}>
          <div className="empty-state-icon">🌱</div>
          <p className="empty-state-text">No habits defined yet.</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 320, textAlign: 'center' }}>
            Start by defining habits you want to track daily — like Sprint 1, Wake Up Time, or Exercise.
          </p>
          <button className="btn btn-primary" onClick={onAddHabit}>+ Define First Habit</button>
        </div>
      )}

      {/* Production sprints section */}
      {prodHabits.length > 0 && (
        <section>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            🔥 Production Sprints
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prodHabits.map(habit => (
              <HabitRow
                key={habit.id}
                habit={habit}
                log={todayLogs.find(l => l.habitId === habit.id)}
                streak={getStreak(habit.id)}
                onSave={(value, notes) => onUpsert({ userId, habitId: habit.id, date, value, notes })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Other habits */}
      {otherHabits.length > 0 && (
        <section>
          {prodHabits.length > 0 && (
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              📋 Other Habits
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {otherHabits.map(habit => (
              <HabitRow
                key={habit.id}
                habit={habit}
                log={todayLogs.find(l => l.habitId === habit.id)}
                streak={getStreak(habit.id)}
                onSave={(value, notes) => onUpsert({ userId, habitId: habit.id, date, value, notes })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
