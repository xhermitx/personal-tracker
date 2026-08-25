'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Task } from '@/types';
import { FiCalendar, FiCheckCircle, FiAlertCircle, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type ViewMode = 'day' | 'week' | 'month';

function toYMD(d: Date) { return d.toISOString().split('T')[0]; }
function getWeekStr(d: Date) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-${String(week).padStart(2, '0')}`;
}
function getMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatDate(ymd: string) {
  const d = new Date(ymd + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function formatWeek(wStr: string) {
  const [year, wk] = wStr.split('-');
  return `Week ${Number(wk)}, ${year}`;
}
function formatMonth(mStr: string) {
  const [year, mon] = mStr.split('-');
  const d = new Date(Number(year), Number(mon) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── Generate date list (last 60 days) ───────────────────────
function getLast60Days(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toYMD(d));
  }
  return days;
}

function getLastNWeeks(n: number): string[] {
  const weeks = new Set<string>();
  for (let i = 0; i < n * 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weeks.add(getWeekStr(d));
  }
  return Array.from(weeks);
}

function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(getMonthStr(d));
  }
  return months;
}

interface TaskEntry {
  task: Task;
  state: 'completed' | 'overdue-completed' | 'overdue-pending';
}

export default function HistoryPage() {
  const { userId } = useParams() as { userId: string };
  const { state } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDay, setSelectedDay] = useState(toYMD(new Date()));
  const [selectedWeek, setSelectedWeek] = useState(getWeekStr(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getMonthStr(new Date()));

  const userTasks = state.tasks.filter(t => 
    t.assigneeId === userId || (t.scope === 'personal' && !t.assigneeId)
  );

  // ── Day view: tasks that were 'due' on this day ──────────────
  const getDayEntries = (day: string): TaskEntry[] => {
    const entries: TaskEntry[] = [];
    userTasks.forEach(task => {
      if (task.dueDate !== day) return;
      const doneDay = task.doneAt ? task.doneAt.split('T')[0] : null;
      if (doneDay === day) {
        entries.push({ task, state: 'completed' });
      } else if (doneDay && doneDay > day) {
        entries.push({ task, state: 'overdue-completed' });
      } else if (!task.doneAt) {
        entries.push({ task, state: 'overdue-pending' });
      }
    });
    return entries;
  };

  // ── Week view: gather ALL tasks whose dueDate falls within this week ─
  const getWeekEntries = (week: string): TaskEntry[] => {
    const entries: TaskEntry[] = [];
    const seen = new Set<string>(); // deduplicate
    userTasks.forEach(task => {
      // A task belongs to this week if its effective due date falls within this week
      const taskWeek = task.dueDate ? getWeekStr(new Date(task.dueDate + 'T00:00:00')) : task.dueWeek;
      if (taskWeek !== week) return;
      if (seen.has(task.id)) return;
      seen.add(task.id);

      if (task.doneAt) {
        const doneWeek = getWeekStr(new Date(task.doneAt));
        if (doneWeek === week) {
          entries.push({ task, state: 'completed' });
        } else if (doneWeek > week) {
          // Completed but in a LATER week — was overdue
          entries.push({ task, state: 'overdue-completed' });
        }
      } else {
        // Not done at all — still pending / overdue
        entries.push({ task, state: 'overdue-pending' });
      }
    });
    return entries;
  };

  // ── Month view: gather ALL tasks whose dueDate falls within this month ─
  const getMonthEntries = (month: string): TaskEntry[] => {
    const entries: TaskEntry[] = [];
    const seen = new Set<string>();
    userTasks.forEach(task => {
      const taskMonth = task.dueDate
        ? getMonthStr(new Date(task.dueDate + 'T00:00:00'))
        : task.dueMonth;
      if (taskMonth !== month) return;
      if (seen.has(task.id)) return;
      seen.add(task.id);

      if (task.doneAt) {
        const doneMonth = getMonthStr(new Date(task.doneAt));
        if (doneMonth === month) {
          entries.push({ task, state: 'completed' });
        } else if (doneMonth > month) {
          entries.push({ task, state: 'overdue-completed' });
        }
      } else {
        entries.push({ task, state: 'overdue-pending' });
      }
    });
    return entries;
  };

  const days = getLast60Days();
  const weeks = getLastNWeeks(12);
  const months = getLastNMonths(6);

  const currentEntries = viewMode === 'day'
    ? getDayEntries(selectedDay)
    : viewMode === 'week'
      ? getWeekEntries(selectedWeek)
      : getMonthEntries(selectedMonth);

  const done = currentEntries.filter(e => e.state === 'completed').length;
  const overdueDone = currentEntries.filter(e => e.state === 'overdue-completed').length;
  const pending = currentEntries.filter(e => e.state === 'overdue-pending').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Task History</h1>
          <p className="page-subtitle">Review past tasks, completion status, and overdue items.</p>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['day', 'week', 'month'] as ViewMode[]).map(v => (
          <button
            key={v}
            className={`btn ${viewMode === v ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setViewMode(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
        {/* Left: Date Picker */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select {viewMode === 'day' ? 'Date' : viewMode === 'week' ? 'Week' : 'Month'}
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {viewMode === 'day' && days.map(day => {
              const entries = getDayEntries(day);
              const isSelected = day === selectedDay;
              const hasDone = entries.some(e => e.state === 'completed');
              const hasPending = entries.some(e => e.state !== 'completed');
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="history-date-item"
                  style={{ background: isSelected ? 'var(--accent-light)' : 'transparent', color: isSelected ? 'var(--accent)' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}
                >
                  <span>{new Date(day + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {hasDone && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />}
                    {hasPending && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />}
                  </span>
                </button>
              );
            })}
            {viewMode === 'week' && weeks.map(wk => {
              const isSelected = wk === selectedWeek;
              const wkEntries = getWeekEntries(wk);
              const hasDone = wkEntries.some(e => e.state === 'completed');
              const hasPending = wkEntries.some(e => e.state === 'overdue-pending');
              return (
                <button key={wk} onClick={() => setSelectedWeek(wk)} className="history-date-item"
                  style={{ background: isSelected ? 'var(--accent-light)' : 'transparent', color: isSelected ? 'var(--accent)' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                  <span>{formatWeek(wk)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {wkEntries.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{wkEntries.length}</span>}
                    {hasDone && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />}
                    {hasPending && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />}
                  </span>
                </button>
              );
            })}
            {viewMode === 'month' && months.map(mo => {
              const isSelected = mo === selectedMonth;
              const moEntries = getMonthEntries(mo);
              const hasDone = moEntries.some(e => e.state === 'completed');
              const hasPending = moEntries.some(e => e.state === 'overdue-pending');
              return (
                <button key={mo} onClick={() => setSelectedMonth(mo)} className="history-date-item"
                  style={{ background: isSelected ? 'var(--accent-light)' : 'transparent', color: isSelected ? 'var(--accent)' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                  <span>{formatMonth(mo)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {moEntries.length > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{moEntries.length}</span>}
                    {hasDone && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />}
                    {hasPending && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', display: 'inline-block' }} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Task list */}
        <div>
          <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {viewMode === 'day' ? formatDate(selectedDay) : viewMode === 'week' ? formatWeek(selectedWeek) : formatMonth(selectedMonth)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              {currentEntries.length} task{currentEntries.length !== 1 ? 's' : ''} total
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green)' }}>{done}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {viewMode === 'day' ? 'Completed' : `Done within ${viewMode}`}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--orange)' }}>{overdueDone}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {viewMode === 'day' ? 'Done Later' : `Done in next ${viewMode}`}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--red)' }}>{pending}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Still Pending</div>
              </div>
              {currentEntries.length > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {Math.round((done / currentEntries.length) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completion Rate</div>
                </div>
              )}
            </div>
          </div>

          {currentEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiCalendar /></div>
              <p className="empty-state-text">No tasks found for this {viewMode}.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentEntries.map(({ task, state: entryState }) => (
                <div key={task.id} className="card history-task-row" style={{
                  borderLeft: `3px solid ${entryState === 'completed' ? 'var(--green)' : entryState === 'overdue-completed' ? 'var(--orange)' : 'var(--red)'}`,
                  padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: entryState === 'completed' ? 'var(--green)' : entryState === 'overdue-completed' ? 'var(--orange)' : 'var(--red)', fontSize: '1.1rem', flexShrink: 0 }}>
                      {entryState === 'completed' ? <FiCheckCircle /> : entryState === 'overdue-completed' ? <FiClock /> : <FiAlertCircle />}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, textDecoration: entryState === 'completed' ? 'line-through' : 'none', opacity: entryState === 'completed' ? 0.7 : 1 }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{task.description}</div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {entryState === 'completed' && task.doneAt && `Done ${new Date(task.doneAt).toLocaleDateString()}`}
                      {entryState === 'overdue-completed' && task.doneAt && `Completed ${new Date(task.doneAt).toLocaleDateString()}`}
                      {entryState === 'overdue-pending' && 'Still pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
