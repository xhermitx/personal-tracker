'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { User, ModuleType } from '@/types';
import UserFormModal from '@/components/UserFormModal';

const USER_COLORS = [
  '#7c6aff', '#ff6b6b', '#3de88a', '#ff9f43', '#4ecdc4',
  '#a29bfe', '#fd79a8', '#55efc4', '#fdcb6e', '#74b9ff',
];

export default function HomePage() {
  const { state, addUser } = useApp();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleUserClick = (user: User) => {
    const firstModule = user.modules[0] ?? 'todo';
    router.push(`/${user.id}/${firstModule}`);
  };

  const getModuleLabel = (modules: ModuleType[]) => {
    if (modules.length === 0) return 'No modules';
    if (modules.length === 2) return 'Todo · Habits';
    return modules[0] === 'todo' ? 'Todo Board' : 'Habit Tracker';
  };

  return (
    <main className="landing-page">
      <div className="landing-hero">
        <h1>Your <span>Personal</span> Tracker</h1>
        <p>Select your profile to continue tracking your goals &amp; habits.</p>
      </div>

      <div className="users-grid">
        {state.users.map(user => (
          <div
            key={user.id}
            className="user-card"
            onClick={() => handleUserClick(user)}
            style={{ ['--user-color' as string]: user.color }}
          >
            <div
              className="user-card-avatar"
              style={{ background: `${user.color}22`, border: `2px solid ${user.color}44` }}
            >
              {user.avatar}
            </div>
            <div className="user-card-name">{user.name}</div>
            <div className="user-card-modules">{getModuleLabel(user.modules)}</div>
          </div>
        ))}

        <button className="add-user-card" onClick={() => setShowModal(true)}>
          <div className="add-user-icon">+</div>
          <div className="add-user-text">Add User</div>
        </button>
      </div>

      {state.users.length > 0 && (
        <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => router.push('/admin')}>
            ⚙️ Manage Users
          </button>
        </div>
      )}

      {showModal && (
        <UserFormModal
          onClose={() => setShowModal(false)}
          onSave={(data) => { addUser(data); setShowModal(false); }}
          colors={USER_COLORS}
        />
      )}
    </main>
  );
}
