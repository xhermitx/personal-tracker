'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { User } from '@/types';
import UserFormModal from '@/components/UserFormModal';

const USER_COLORS = [
  '#7c6aff', '#ff6b6b', '#3de88a', '#ff9f43', '#4ecdc4',
  '#a29bfe', '#fd79a8', '#55efc4', '#fdcb6e', '#74b9ff',
];

export default function AdminPage() {
  const { state, addUser, updateUser, deleteUser } = useApp();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <main style={{ minHeight: '100vh', padding: '40px', maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ User Management</h1>
          <p className="page-subtitle">Add, edit, or configure users and their module access.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/')}>← Back</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add User</button>
        </div>
      </div>

      {state.users.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 80 }}>
          <div className="empty-state-icon">👥</div>
          <p className="empty-state-text">No users yet. Create your first user to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add First User</button>
        </div>
      ) : (
        <div className="admin-users-grid">
          {state.users.map(user => {
            const taskCount = state.tasks.filter(t => t.assigneeId === user.id).length;
            const habitCount = state.habitLogs.filter(h => h.userId === user.id).length;
            return (
              <div key={user.id} className="admin-user-card">
                <div className="admin-user-header">
                  <div
                    className="admin-user-avatar"
                    style={{ background: `${user.color}22`, border: `2px solid ${user.color}44` }}
                  >
                    {user.avatar}
                  </div>
                  <div className="admin-user-info">
                    <div className="admin-user-name">{user.name}</div>
                    <div className="admin-user-date">Added {formatDate(user.createdAt)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: user.color }}>{taskCount}</div>
                    <div className="text-xs text-muted">Tasks</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: user.color }}>{habitCount}</div>
                    <div className="text-xs text-muted">Habit entries</div>
                  </div>
                </div>

                <div>
                  <div className="form-label" style={{ marginBottom: 8 }}>Active Modules</div>
                  <div className="module-toggles">
                    {(['todo', 'habits'] as const).map(mod => (
                      <button
                        key={mod}
                        className={`module-toggle${user.modules.includes(mod) ? ' active' : ''}`}
                        onClick={() => {
                          const newModules = user.modules.includes(mod)
                            ? user.modules.filter(m => m !== mod)
                            : [...user.modules, mod];
                          if (newModules.length > 0) updateUser(user.id, { modules: newModules });
                        }}
                      >
                        {mod === 'todo' ? '📋 Todo' : '🌱 Habits'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-user-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => router.push(`/${user.id}/${user.modules[0] ?? 'todo'}`)}
                  >
                    Open →
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditUser(user)}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => {
                    if (confirm(`Delete ${user.name}? This will remove all their data.`)) {
                      deleteUser(user.id);
                    }
                  }}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <UserFormModal
          colors={USER_COLORS}
          onClose={() => setShowAdd(false)}
          onSave={(data) => { addUser(data); setShowAdd(false); }}
        />
      )}
      {editUser && (
        <UserFormModal
          initial={editUser}
          colors={USER_COLORS}
          onClose={() => setEditUser(null)}
          onSave={(data) => { updateUser(editUser.id, data); setEditUser(null); }}
        />
      )}
    </main>
  );
}
