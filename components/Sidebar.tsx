'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { User } from '@/types';

interface Props {
  user: User;
}

const NAV_ITEMS = [
  { key: 'todo', label: 'Todo Board', icon: '📋' },
  { key: 'habits', label: 'Habit Tracker', icon: '🌱' },
];

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useApp();

  const pendingTasks = state.tasks.filter(t => t.assigneeId === user.id && t.status !== 'done').length;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">✦</div>
        <span className="sidebar-logo-text">Tracker</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.filter(item => user.modules.includes(item.key as 'todo' | 'habits')).map(item => {
          const href = `/${user.id}/${item.key}`;
          const isActive = pathname === href;
          return (
            <Link key={item.key} href={href} className={`nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-item-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.key === 'todo' && pendingTasks > 0 && (
                <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>{pendingTasks}</span>
              )}
            </Link>
          );
        })}

        <div className="divider" />

        <button className="nav-item" onClick={() => router.push('/admin')}>
          <span className="nav-item-icon">⚙️</span>
          <span>Manage Users</span>
        </button>
        <button className="nav-item" onClick={() => router.push('/')}>
          <span className="nav-item-icon">←</span>
          <span>Switch User</span>
        </button>
      </nav>

      <div className="sidebar-user">
        <div
          className="sidebar-avatar"
          style={{ background: `${user.color}22`, border: `2px solid ${user.color}44` }}
        >
          {user.avatar}
        </div>
        <div>
          <div className="sidebar-user-name">{user.name}</div>
          <div className="sidebar-user-sub">{user.modules.length} module{user.modules.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </aside>
  );
}
