'use client';

import { useState } from 'react';
import { Habit, HabitType } from '@/types';

const HABIT_EMOJIS = [
  '⏱️','🔥','🌅','💪','🧘','📚','💧','🏃','🎯','💊',
  '🧠','✍️','🎸','🌿','🍎','😴','☕','🚶','🏋️','🩺',
  '🎨','💻','📝','🎵','🌊','⛰️','🚴','🧹','💡','🌙',
  '🤸','🥗','🧃','📖','🏊','🚀','⚡','🦷','🌍','🎤',
];

const HABIT_COLORS = [
  '#7c6aff', '#ff6b6b', '#3de88a', '#ff9f43', '#4ecdc4',
  '#a29bfe', '#fd79a8', '#55efc4', '#fdcb6e', '#74b9ff',
  '#e17055', '#00b894', '#6c5ce7', '#f9ca24', '#22a6b3',
];

const TYPE_LABELS: Record<HabitType, { label: string; desc: string; icon: string }> = {
  duration: { label: 'Duration', desc: 'Track time spent (e.g. work sessions)', icon: '⏱️' },
  time:     { label: 'Clock Time', desc: 'Log a specific time (e.g. wake up)', icon: '🕐' },
  number:   { label: 'Number', desc: 'Track a numeric value (e.g. steps)', icon: '🔢' },
  yesno:    { label: 'Yes / No', desc: 'Simple done or not done', icon: '✅' },
};

interface Props {
  initial?: Partial<Habit>;
  onClose: () => void;
  onSave: (data: Omit<Habit, 'id' | 'createdAt'>) => void;
  userId: string;
  nextOrder: number;
}

export default function HabitDefinitionModal({ initial, onClose, onSave, userId, nextOrder }: Props) {
  const [name, setName]     = useState(initial?.name ?? '');
  const [type, setType]     = useState<HabitType>(initial?.type ?? 'duration');
  const [icon, setIcon]     = useState(initial?.icon ?? '⏱️');
  const [color, setColor]   = useState(initial?.color ?? HABIT_COLORS[0]);
  const [unit, setUnit]     = useState(initial?.unit ?? '');
  const [isProd, setIsProd] = useState(initial?.isProductionSprint ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const habitData: any = {
      userId,
      name: name.trim(),
      type,
      icon,
      color,
      isProductionSprint: type === 'duration' ? isProd : false,
      order: initial?.order ?? nextOrder,
      archived: initial?.archived ?? false,
    };
    
    if (type === 'number' && unit.trim()) {
      habitData.unit = unit.trim();
    }

    onSave(habitData as Omit<Habit, 'id' | 'createdAt'>);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{initial?.id ? '✏️ Edit Habit' : '+ Define New Habit'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Habit Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Sprint 1, Wake Up Time, Exercise..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Type */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.entries(TYPE_LABELS) as [HabitType, typeof TYPE_LABELS[HabitType]][]).map(([t, cfg]) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${type === t ? color : 'var(--border)'}`,
                    background: type === t ? `${color}18` : 'var(--bg-surface)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                    <span>{cfg.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.857rem', color: type === t ? color : 'var(--text-primary)' }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cfg.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Unit (number type only) */}
          {type === 'number' && (
            <div className="form-group">
              <label className="form-label">Unit Label (optional)</label>
              <input
                className="form-input"
                placeholder="e.g. steps, km, pages, reps..."
                value={unit}
                onChange={e => setUnit(e.target.value)}
                style={{ maxWidth: 240 }}
              />
            </div>
          )}

          {/* Production sprint toggle (duration only) */}
          {type === 'duration' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              background: isProd ? `${color}12` : 'var(--bg-surface)',
              border: `1px solid ${isProd ? `${color}50` : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
            }} onClick={() => setIsProd(v => !v)}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.857rem' }}>🔥 Count toward Production Time</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Daily sum of all such habits = Total Production Time
                </div>
              </div>
              <label className="yesno-toggle" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={isProd} onChange={e => setIsProd(e.target.checked)} />
                <span className="yesno-slider" />
              </label>
            </div>
          )}

          {/* Icon */}
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="emoji-grid" style={{ gridTemplateColumns: 'repeat(10, 1fr)', maxHeight: 120 }}>
              {HABIT_EMOJIS.map(em => (
                <button type="button" key={em} className={`emoji-option${icon === em ? ' selected' : ''}`}
                  onClick={() => setIcon(em)}>{em}</button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-grid">
              {HABIT_COLORS.map(c => (
                <button type="button" key={c}
                  className={`color-option${color === c ? ' selected' : ''}`}
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              {initial?.id ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
