'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import InviteModal from './InviteModal';
import { FiClipboard, FiLink, FiLogOut, FiBriefcase, FiBarChart2 } from 'react-icons/fi';

export default function OrgSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, addInvite } = useApp();
  const [inviteLink, setInviteLink] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const currentUser = state.users.find(u => 
    u.id === auth.currentUser?.uid || (u.email && u.email === auth.currentUser?.email)
  );

  const handleGenerateInvite = () => {
    if (!currentUser?.orgId) return;
    const token = addInvite({
      orgId: currentUser.orgId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      used: false
    });
    const link = `${window.location.origin}/join?token=${token}`;
    setInviteLink(link);
    setShowInviteModal(true);
  };

  const pendingOrgTasks = state.tasks.filter(t => t.scope === 'org' && t.status !== 'done').length;
  // Make sure we only count members for THIS org
  const memberCount = state.users.filter(u => u.role === 'member' && u.orgId === currentUser?.orgId).length;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ background: 'var(--accent)', color: '#fff' }}>
          <FiBriefcase size={18} />
        </div>
        <span className="sidebar-logo-text">Org Hub</span>
      </div>

      <nav className="sidebar-nav">
        <Link href="/org/todo" className={`nav-item${pathname === '/org/todo' ? ' active' : ''}`}>
          <span className="nav-item-icon"><FiClipboard /></span>
          <span style={{ flex: 1 }}>Org Board</span>
          {pendingOrgTasks > 0 && (
            <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>{pendingOrgTasks}</span>
          )}
        </Link>

        <Link href="/org/analytics" className={`nav-item${pathname === '/org/analytics' ? ' active' : ''}`}>
          <span className="nav-item-icon"><FiBarChart2 /></span>
          <span>Analytics</span>
        </Link>

        <div className="divider" />
        
        <div style={{ padding: '0 12px', marginBottom: 12 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Members ({memberCount})
          </div>
        </div>

        {state.users.filter(u => u.role === 'member' && u.orgId === currentUser?.orgId).map(u => (
          <div key={u.id} className="nav-item" style={{ opacity: 0.8, cursor: 'default', padding: '6px 12px' }}>
            <span style={{ fontSize: '1.2rem', marginRight: 8 }}>{u.avatar}</span>
            <span>{u.name}</span>
          </div>
        ))}

        <div className="divider" />

        <button className="nav-item" onClick={handleGenerateInvite} style={{ color: 'var(--green)' }}>
          <span className="nav-item-icon"><FiLink /></span>
          <span>Invite Member</span>
        </button>

        <div className="divider" />

        <button className="nav-item" onClick={async () => {
          await auth.signOut();
          router.push('/');
        }}>
          <span className="nav-item-icon"><FiLogOut /></span>
          <span>Sign Out</span>
        </button>
      </nav>

      {showInviteModal && (
        <InviteModal inviteLink={inviteLink} onClose={() => setShowInviteModal(false)} />
      )}
    </aside>
  );
}
