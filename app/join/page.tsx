'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Invite } from '@/types';

const USER_COLORS = [
  '#7c6aff', '#ff6b6b', '#3de88a', '#ff9f43', '#4ecdc4',
  '#a29bfe', '#fd79a8', '#55efc4', '#fdcb6e', '#74b9ff',
];

function JoinContent() {
  const { state, addUser, updateInvite } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg("No invite token provided.");
      return;
    }
    const found = state.invites.find(i => i.id === token);
    if (!found) {
      const timer = setTimeout(() => {
        const checkAgain = state.invites.find(i => i.id === token);
        if (!checkAgain) setErrorMsg("Invalid or expired invite link.");
        else if (checkAgain.used) setErrorMsg("This invite link has already been used.");
        else setInvite(checkAgain);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      if (found.used) setErrorMsg("This invite link has already been used.");
      else setInvite(found);
    }
  }, [token, state.invites]);

  const handleJoin = async () => {
    if (!invite) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const existingUser = state.users.find(u => u.email === fbUser.email);
      if (existingUser) {
        if (existingUser.role === 'org') router.push(`/org/todo`);
        else router.push(`/${existingUser.id}/todo`);
        return;
      }

      const newUserObj = {
        id: fbUser.uid,
        orgId: invite.orgId,
        role: 'member' as const,
        name: fbUser.displayName || 'New Member',
        email: fbUser.email || '',
        avatar: fbUser.displayName ? fbUser.displayName.charAt(0).toUpperCase() : 'M',
        color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
        modules: ['todo', 'habits'] as any
      };
      
      await addUser(newUserObj);
      await updateInvite(invite.id, { used: true });
      
      router.push(`/${fbUser.uid}/todo`);
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to join. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (errorMsg) {
    return (
      <div className="empty-state" style={{ marginTop: '20vh' }}>
        <div className="empty-state-icon">❌</div>
        <h2 style={{ marginBottom: 12 }}>Invite Error</h2>
        <p className="empty-state-text">{errorMsg}</p>
        <button className="btn btn-ghost" onClick={() => router.push('/')}>Go Home</button>
      </div>
    );
  }

  if (!invite) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20vh' }}>
        <p>Validating invite...</p>
      </div>
    );
  }

  return (
    <div className="landing-hero" style={{ textAlign: 'center', marginTop: '20vh' }}>
      <h1>Join Organization</h1>
      <p>You have been invited to join an organization tracker.</p>
      <button 
        className="btn btn-primary" 
        onClick={handleJoin} 
        disabled={loading}
        style={{ marginTop: '20px', fontSize: '1.2rem', padding: '12px 24px' }}
      >
        {loading ? 'Joining...' : 'Accept Invite with Google'}
      </button>
    </div>
  );
}

export default function JoinPage() {
  return (
    <main className="landing-page" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: 50 }}>Loading...</div>}>
        <JoinContent />
      </Suspense>
    </main>
  );
}
