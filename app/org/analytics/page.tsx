'use client';

import { useApp } from '@/context/AppContext';
import { auth } from '@/lib/firebase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';

function getMonthStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function toYMD(d: Date) { return d.toISOString().split('T')[0]; }
function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}m`;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

export default function OrgAnalyticsPage() {
  const { state } = useApp();
  const curUser = state.users.find(u =>
    u.id === auth.currentUser?.uid || (u.email && u.email === auth.currentUser?.email)
  );
  const orgId = curUser?.orgId;
  const orgMembers = state.users.filter(u => u.role === 'member' && u.orgId === orgId);
  const orgTasks = state.tasks.filter(t => t.scope === 'org');
  const curMonth = getMonthStr();
  const today = toYMD(new Date());

  // ── Overall stats ────────────────────────────────────────────
  const totalTasks = orgTasks.length;
  const doneTasks = orgTasks.filter(t => t.status === 'done').length;
  const overallRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const pendingHours = orgTasks.filter(t => t.status !== 'done').reduce((a, t) => a + (t.estimatedMinutes || 0), 0);

  // ── Per-member performance ───────────────────────────────────
  const memberStats = orgMembers.map(member => {
    const mTasks = orgTasks.filter(t => t.assigneeId === member.id);
    const mDone = mTasks.filter(t => t.status === 'done').length;
    const mPending = mTasks.filter(t => t.status !== 'done').length;
    const rate = mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0;
    const overdueCount = mTasks.filter(t => {
      if (t.status === 'done') return false;
      return t.dueDate && t.dueDate < today;
    }).length;
    return {
      name: member.name,
      avatar: member.avatar,
      color: member.color,
      total: mTasks.length,
      done: mDone,
      pending: mPending,
      overdue: overdueCount,
      rate,
    };
  });

  const pieData = [
    { name: 'Done', value: doneTasks },
    { name: 'Pending', value: totalTasks - doneTasks },
  ].filter(d => d.value > 0);

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
          <h1 className="page-title">Org Analytics</h1>
          <p className="page-subtitle">Team-wide productivity and performance overview.</p>
        </div>
      </div>

      {/* Overall stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Org Tasks" value={totalTasks} />
        <StatCard label="Completed" value={doneTasks} color="var(--green)" />
        <StatCard label="Completion Rate" value={`${overallRate}%`} color={overallRate >= 75 ? 'var(--green)' : overallRate >= 50 ? 'var(--orange)' : 'var(--red)'} />
        <StatCard label="Remaining Effort" value={pendingHours > 0 ? formatMinutes(pendingHours) : '—'} sub="estimated for pending tasks" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Donut chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Overall Task Distribution</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  <Cell fill="#059669" />
                  <Cell fill="#dc2626" />
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks yet</div>
          )}
        </div>

        {/* Per-member bar chart */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Tasks Per Member</div>
          {memberStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={memberStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="done" name="Done" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No members yet</div>
          )}
        </div>
      </div>

      {/* Per-member detail cards */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Member Performance</div>
        {memberStats.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No members yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {memberStats.map(m => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${m.color}22`, border: `2px solid ${m.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {m.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{m.name}</div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${m.rate}%`, background: m.rate >= 75 ? 'var(--green)' : m.rate >= 50 ? 'var(--orange)' : 'var(--red)', borderRadius: 999, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', textAlign: 'center' }}>
                  <div><div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.rate}%</div><div style={{ color: 'var(--text-muted)' }}>Rate</div></div>
                  <div><div style={{ fontWeight: 700, color: 'var(--green)' }}>{m.done}</div><div style={{ color: 'var(--text-muted)' }}>Done</div></div>
                  <div><div style={{ fontWeight: 700, color: 'var(--orange)' }}>{m.pending}</div><div style={{ color: 'var(--text-muted)' }}>Pending</div></div>
                  {m.overdue > 0 && <div><div style={{ fontWeight: 700, color: 'var(--red)' }}>{m.overdue}</div><div style={{ color: 'var(--text-muted)' }}>Overdue</div></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
