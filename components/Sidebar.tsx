'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { User } from '@/types';
import { FiClipboard, FiActivity, FiSettings, FiLogOut, FiCalendar, FiBarChart2 } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';

interface Props {
  user: User;
}

const NAV_ITEMS = [
  { key: 'todo', label: 'Todo Board', icon: <FiClipboard /> },
  { key: 'habits', label: 'Habit Tracker', icon: <FiActivity /> },
];

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useApp();

  const pendingTasks = state.tasks.filter(t => t.assigneeId === user.id && t.status !== 'done').length;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><BsStars /></div>
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

        {/* History and Analytics always visible */}
        <Link href={`/${user.id}/history`} className={`nav-item${pathname === `/${user.id}/history` ? ' active' : ''}`}>
          <span className="nav-item-icon"><FiCalendar /></span>
          <span>History</span>
        </Link>
        <Link href={`/${user.id}/analytics`} className={`nav-item${pathname === `/${user.id}/analytics` ? ' active' : ''}`}>
          <span className="nav-item-icon"><FiBarChart2 /></span>
          <span>Analytics</span>
        </Link>

        <div className="divider" />

        {user.role === 'org' && (
          <button className="nav-item" onClick={() => router.push('/admin')}>
            <span className="nav-item-icon"><FiSettings /></span>
            <span>Manage Users</span>
          </button>
        )}
        <button className="nav-item" onClick={async () => {
          const { auth } = await import('@/lib/firebase');
          await auth.signOut();
          router.push('/');
        }}>
          <span className="nav-item-icon"><FiLogOut /></span>
          <span>Sign Out</span>
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
