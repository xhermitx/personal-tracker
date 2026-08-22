'use client';

import { User, ModuleType } from '@/types';

const EMOJIS = [
  '😀','😎','🧑‍💻','👩‍🎨','🧑‍🔬','👨‍🚀','🦸','🧙','🐉','🦊',
  '🌟','⚡','🔥','🌊','🎯','🎸','🏆','🚀','💡','🎨',
  '🍀','🌸','🦋','🐬','🦁','🐼','🦄','🌈','⛰️','🌙',
];

interface Props {
  initial?: Partial<User>;
  onClose: () => void;
  onSave: (data: Omit<User, 'id' | 'createdAt'>) => void;
  colors: string[];
}

import { useState } from 'react';

export default function UserFormModal({ initial, onClose, onSave, colors }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [avatar, setAvatar] = useState(initial?.avatar ?? '😀');
  const [color, setColor] = useState(initial?.color ?? colors[0]);
  const [modules, setModules] = useState<ModuleType[]>(initial?.modules ?? ['todo', 'habits']);

  const toggleModule = (mod: ModuleType) => {
    setModules(prev =>
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), avatar, color, modules });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Edit User' : 'Add New User'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              placeholder="Enter user name..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Avatar</label>
            <div className="emoji-grid">
              {EMOJIS.map(em => (
                <button
                  type="button"
                  key={em}
                  className={`emoji-option${avatar === em ? ' selected' : ''}`}
                  onClick={() => setAvatar(em)}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="color-grid">
              {colors.map(c => (
                <button
                  type="button"
                  key={c}
                  className={`color-option${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Modules</label>
            <div className="module-toggles">
              {(['todo', 'habits'] as ModuleType[]).map(mod => (
                <button
                  type="button"
                  key={mod}
                  className={`module-toggle${modules.includes(mod) ? ' active' : ''}`}
                  onClick={() => toggleModule(mod)}
                >
                  {mod === 'todo' ? '📋 Todo Board' : '🌱 Habit Tracker'}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || modules.length === 0}>
              {initial ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
