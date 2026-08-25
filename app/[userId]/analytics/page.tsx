'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

type TabType = 'day' | 'week' | 'month';

function toYMD(d: Date) { return d.toISOString().split('T')[0]; }
function getWeekStr(d: Date) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-${String(week).padStart(2, '0')}`;
}
function getMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}m`;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

const COLORS = ['#4f46e5', '#059669', '#d97706', '#dc2626'];

export default function AnalyticsPage() {
  const { userId } = useParams() as { userId: string };
  const { state } = useApp();
  const [tab, setTab] = useState<TabType>('day');

  const userTasks = state.tasks.filter(t => t.assigneeId === userId);
  const today = toYMD(new Date());
  const curWeek = getWeekStr(new Date());
  const curMonth = getMonthStr(new Date());

  // ── Today stats ──────────────────────────────────────────────
  const todayTasks = userTasks.filter(t => t.dueDate === today);
  const todayDone = todayTasks.filter(t => t.doneAt && t.doneAt.split('T')[0] === today);
  const todayPending = todayTasks.filter(t => t.status !== 'done');
  const todayRemainingMins = todayPending.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const todayPieData = [
    { name: 'Done', value: todayDone.length },
    { name: 'Pending', value: todayPending.length },
  ].filter(d => d.value > 0);

  // ── This week stats ──────────────────────────────────────────
  const weekTasks = userTasks.filter(t => {
    const taskWeek = t.dueDate ? getWeekStr(new Date(t.dueDate + 'T00:00:00')) : t.dueWeek;
    return taskWeek === curWeek;
  });
  const weekDone = weekTasks.filter(t => t.status === 'done');
  const weekRate = weekTasks.length > 0 ? Math.round((weekDone.length / weekTasks.length) * 100) : 0;

  // Build bar chart data: tasks done per day this week
  const weekDays: { day: string; label: string; done: number; pending: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ymd = toYMD(d);
    const dayTasks = userTasks.filter(t => t.dueDate === ymd);
    weekDays.push({
      day: ymd,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      done: dayTasks.filter(t => t.status === 'done').length,
      pending: dayTasks.filter(t => t.status !== 'done').length,
    });
  }

  // ── Monthly stats ────────────────────────────────────────────
  const monthTasks = userTasks.filter(t => {
    const taskMonth = t.dueDate ? getMonthStr(new Date(t.dueDate + 'T00:00:00')) : t.dueMonth;
    return taskMonth === curMonth;
  });
  const monthDone = monthTasks.filter(t => t.status === 'done');
  const monthRate = monthTasks.length > 0 ? Math.round((monthDone.length / monthTasks.length) * 100) : 0;
  const monthRemainingMins = monthTasks.filter(t => t.status !== 'done').reduce((a, t) => a + (t.estimatedMinutes || 0), 0);

  // Streak: consecutive days with at least one task completed
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ymd = toYMD(d);
    const dayDone = userTasks.filter(t => t.doneAt && t.doneAt.split('T')[0] === ymd).length;
    if (dayDone > 0) streak++;
    else break;
  }

  // Weekly trend for last 8 weeks
  const weeklyTrend: { week: string; rate: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const wk = getWeekStr(d);
    const wTasks = userTasks.filter(t => {
      const taskWeek = t.dueDate ? getWeekStr(new Date(t.dueDate + 'T00:00:00')) : t.dueWeek;
      return taskWeek === wk;
    });
    const wDone = wTasks.filter(t => t.status === 'done').length;
    weeklyTrend.push({
      week: `Wk ${wk.split('-')[1]}`,
      rate: wTasks.length > 0 ? Math.round((wDone / wTasks.length) * 100) : 0,
    });
  }

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Insights into your productivity and task completion.</p>
        </div>
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {(['day', 'week', 'month'] as TabType[]).map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab(t)}>
            {t === 'day' ? 'Today' : t === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* TODAY */}
      {tab === 'day' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <StatCard label="Tasks Due Today" value={todayTasks.length} />
            <StatCard label="Completed Today" value={todayDone.length} color="var(--green)" />
            <StatCard label="Still Pending" value={todayPending.length} color="var(--red)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Time Remaining Today</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 700, color: todayRemainingMins > 240 ? 'var(--red)' : 'var(--text-primary)' }}>
                {todayRemainingMins > 0 ? formatMinutes(todayRemainingMins) : '—'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>estimated to complete pending tasks</div>
            </div>
            <div className="card" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Today's Progress</div>
              {todayTasks.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={todayPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {todayPieData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? 'var(--green)' : 'var(--red)'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 20 }}>No tasks due today</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* THIS WEEK */}
      {tab === 'week' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <StatCard label="Tasks This Week" value={weekTasks.length} />
            <StatCard label="Completion Rate" value={`${weekRate}%`} color={weekRate >= 80 ? 'var(--green)' : weekRate >= 50 ? 'var(--orange)' : 'var(--red)'} />
            <StatCard label="Completed" value={weekDone.length} color="var(--green)" />
          </div>
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Tasks Per Day (Last 7 Days)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekDays}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="done" name="Done" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* THIS MONTH */}
      {tab === 'month' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard label="Tasks This Month" value={monthTasks.length} />
            <StatCard label="Completion Rate" value={`${monthRate}%`} color={monthRate >= 80 ? 'var(--green)' : monthRate >= 50 ? 'var(--orange)' : 'var(--red)'} />
            <StatCard label="Current Streak" value={`${streak}d`} color="var(--accent)" sub="consecutive days with tasks done" />
            <StatCard label="Hours Remaining" value={monthRemainingMins > 0 ? formatMinutes(monthRemainingMins) : '—'} sub="to finish all pending tasks" />
          </div>
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Weekly Completion Rate Trend</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="rate" name="Completion %" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
