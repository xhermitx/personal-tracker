'use client';

import { Habit, HabitLog } from '@/types';
import { lastNDays, formatDuration, formatDurationFull, formatTime, today } from '@/lib/dateUtils';

// ── Sparkline (SVG) ────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <div style={{ height: 40 }} />;
  const w = 160, h = 40;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (v / max) * (h - 6) - 3,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${w},${h} L0,${h} Z`;
  const gradId = `g${color.replace(/[^a-z0-9]/gi, '')}`;
  const last = points[points.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="3.5" fill={color} />
    </svg>
  );
}

// ── Bar Chart (Production Trend) ───────────────────────────────────────────

function BarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 400, h = 70;
  const bw = Math.max(4, (w / data.length) - 2);
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = (v / max) * (h - 4);
        return (
          <rect key={i} x={i * (w / data.length)} y={h - bh} width={bw} height={bh}
            rx="2" fill={color} fillOpacity={v > 0 ? 0.75 : 0.15} />
        );
      })}
    </svg>
  );
}

// ── Stats helpers ──────────────────────────────────────────────────────────

function computeStats(habit: Habit, logs: HabitLog[], dates: string[]) {
  const vals = dates.map(d => {
    const log = logs.find(l => l.habitId === habit.id && l.date === d);
    if (!log) return null;
    if (habit.type === 'yesno') return log.value ? 1 : 0;
    if (habit.type === 'time') return log.value ? 1 : 0; // presence
    return Number(log.value) || 0;
  });

  const nonNull = vals.filter(v => v !== null) as number[];
  const logged  = nonNull.filter(v => v > 0);

  const avg7  = dates.slice(-7).map(d => {
    const l = logs.find(x => x.habitId === habit.id && x.date === d);
    if (!l) return 0;
    return habit.type === 'yesno' ? (l.value ? 1 : 0) : Number(l.value) || 0;
  });
  const avg30 = dates.map(d => {
    const l = logs.find(x => x.habitId === habit.id && x.date === d);
    if (!l) return 0;
    return habit.type === 'yesno' ? (l.value ? 1 : 0) : Number(l.value) || 0;
  });

  const mean7  = avg7.reduce((s, v) => s + v, 0) / 7;
  const mean30 = avg30.reduce((s, v) => s + v, 0) / 30;
  const best   = Math.max(...avg30);

  // Streak from today backwards
  let streak = 0;
  const todayStr = today();
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dates[i] > todayStr) continue;
    const v = vals[i];
    if (v === null || v === 0) break;
    streak++;
  }

  return { sparkData: avg30, mean7, mean30, best, streak, loggedCount: logged.length };
}

function fmtVal(habit: Habit, v: number): string {
  if (v === 0) return '—';
  if (habit.type === 'duration') return formatDuration(Math.round(v));
  if (habit.type === 'yesno') return `${Math.round(v * 100)}%`;
  if (habit.type === 'time') return `${Math.round(v * 100)}% days`;
  return `${Math.round(v)}${habit.unit ? ' ' + habit.unit : ''}`;
}

// ── Main Analytics View ────────────────────────────────────────────────────

interface Props {
  habits: Habit[];
  logs: HabitLog[];
}

export default function AnalyticsView({ habits, logs }: Props) {
  const dates30 = lastNDays(30);
  const dates7  = lastNDays(7);
  const activeHabits = habits.filter(h => !h.archived).sort((a, b) => a.order - b.order);
  const prodHabits = activeHabits.filter(h => h.isProductionSprint && h.type === 'duration');

  // Production trend data (last 30 days)
  const prodTrend = dates30.map(d =>
    prodHabits.reduce((sum, h) => {
      const log = logs.find(l => l.habitId === h.id && l.date === d);
      return sum + (log ? Number(log.value) : 0);
    }, 0)
  );
  const totalProd30 = prodTrend.reduce((s, v) => s + v, 0);
  const avgProd7 = prodTrend.slice(-7).reduce((s, v) => s + v, 0) / 7;
  const bestProd = Math.max(...prodTrend);
  const prodDays  = prodTrend.filter(v => v > 0).length;

  if (activeHabits.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <p className="empty-state-text">Define and log habits to see analytics.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Production Trend */}
      {prodHabits.length > 0 && (
        <div className="production-trend-card">
          <div className="production-trend-header">
            <div>
              <div className="production-trend-title">🔥 Production Time Trend — Last 30 Days</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                Combined total of all production sprint habits per day
              </div>
            </div>
            <div className="production-trend-stats">
              <div className="production-trend-stat">
                <div className="production-trend-stat-val">{formatDuration(Math.round(avgProd7))}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>/day</span></div>
                <div className="production-trend-stat-label">7-Day Avg</div>
              </div>
              <div className="production-trend-stat">
                <div className="production-trend-stat-val">{formatDurationFull(totalProd30)}</div>
                <div className="production-trend-stat-label">30-Day Total</div>
              </div>
              <div className="production-trend-stat">
                <div className="production-trend-stat-val">{formatDuration(bestProd)}</div>
                <div className="production-trend-stat-label">Best Day</div>
              </div>
              <div className="production-trend-stat">
                <div className="production-trend-stat-val">{prodDays}</div>
                <div className="production-trend-stat-label">Active Days</div>
              </div>
            </div>
          </div>
          <div className="bar-chart-container">
            <BarChart data={prodTrend} color="var(--accent)" />
          </div>
          <div className="bar-chart-labels">
            <span className="bar-chart-label">{new Date(dates30[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span className="bar-chart-label">Today</span>
          </div>
        </div>
      )}

      {/* Per-habit cards */}
      <div className="analytics-grid">
        {activeHabits.map(habit => {
          const { sparkData, mean7, mean30, best, streak, loggedCount } = computeStats(habit, logs, dates30);
          return (
            <div key={habit.id} className="analytics-habit-card">
              <div className="analytics-habit-header">
                <div className="analytics-habit-icon" style={{ background: `${habit.color}18` }}>
                  {habit.icon}
                </div>
                <div>
                  <div className="analytics-habit-name">{habit.name}</div>
                  <div className="analytics-habit-type">
                    {habit.type === 'duration' ? 'Duration' :
                      habit.type === 'time' ? 'Clock Time' :
                      habit.type === 'yesno' ? 'Yes / No' :
                      `Number${habit.unit ? ` (${habit.unit})` : ''}`}
                    {habit.isProductionSprint && <span className="production-badge" style={{ marginLeft: 6 }}>🔥 Sprint</span>}
                  </div>
                </div>
              </div>

              {/* Sparkline */}
              <div className="sparkline-row">
                <Sparkline data={sparkData} color={habit.color} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                  {streak >= 2 && (
                    <div className="streak-badge">🔥 {streak} day streak</div>
                  )}
                  <div className="sparkline-label">{loggedCount}/30 days</div>
                </div>
              </div>

              {/* Stats */}
              <div className="analytics-stats-row">
                <div className="analytics-stat">
                  <div className="analytics-stat-val" style={{ color: habit.color }}>{fmtVal(habit, mean7)}</div>
                  <div className="analytics-stat-label">7-Day Avg</div>
                </div>
                <div className="analytics-stat">
                  <div className="analytics-stat-val" style={{ color: habit.color }}>{fmtVal(habit, mean30)}</div>
                  <div className="analytics-stat-label">30-Day Avg</div>
                </div>
                <div className="analytics-stat">
                  <div className="analytics-stat-val" style={{ color: habit.color }}>
                    {habit.type === 'duration' ? formatDuration(best) :
                      habit.type === 'yesno' ? (best ? '✓' : '—') :
                      best ? `${best}${habit.unit ? ' ' + habit.unit : ''}` : '—'}
                  </div>
                  <div className="analytics-stat-label">Best Day</div>
                </div>
              </div>

              {/* Day-of-week breakdown */}
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  By Day of Week (last 30 days)
                </div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => {
                    // Collect all logged values on this weekday (0=Mon)
                    const weekdayLogs = dates30
                      .map(ds => {
                        const dow = (new Date(ds + 'T00:00:00').getDay() + 6) % 7; // Mon=0
                        if (dow !== idx) return null;
                        const log = logs.find(l => l.habitId === habit.id && l.date === ds);
                        if (!log) return null;
                        if (habit.type === 'yesno') return log.value ? 1 : 0;
                        if (habit.type === 'time') return log.value ? 1 : 0;
                        return Number(log.value) || 0;
                      })
                      .filter((v): v is number => v !== null && v > 0);
                    const avg = weekdayLogs.length ? weekdayLogs.reduce((s, v) => s + v, 0) / weekdayLogs.length : 0;
                    const rel = best > 0 ? avg / best : 0;
                    return (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{
                          height: 28,
                          width: '100%',
                          borderRadius: 3,
                          background: rel > 0
                            ? `${habit.color}${Math.round(rel * 200 + 30).toString(16).padStart(2, '0')}`
                            : 'rgba(255,255,255,0.05)',
                          position: 'relative',
                        }} title={`${d}: avg ${fmtVal(habit, avg)}`} />
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{d}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
