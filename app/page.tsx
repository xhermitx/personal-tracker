'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { User } from '@/types';
import { signInWithPopup, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const USER_COLORS = [
  '#7c6aff', '#ff6b6b', '#3de88a', '#ff9f43', '#4ecdc4',
  '#a29bfe', '#fd79a8', '#55efc4', '#fdcb6e', '#74b9ff',
];

export default function HomePage() {
  const { state, addUser } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // If the user visits the landing page but they're already logged in,
    // wait for state.users to populate, then auto-redirect them.
    const unsub = auth.onAuthStateChanged(fbUser => {
      if (fbUser && state.users.length > 0) {
        const existingUser = state.users.find(u => 
          u.id === fbUser.uid || (u.email && u.email === fbUser.email)
        );
        if (existingUser) {
          if (existingUser.role === 'org') {
            router.replace(`/org/todo`);
          } else {
            router.replace(`/${existingUser.id}/todo`);
          }
        }
      }
    });
    return unsub;
  }, [state.users, router]);

  const handleSignIn = async (isOrgLogin: boolean) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const existingUser = state.users.find(u => u.email === fbUser.email);
      
      if (existingUser) {
        // User exists. Route them based on their role, regardless of which button they clicked
        if (existingUser.role === 'org') {
          router.push(`/org/todo`);
        } else {
          router.push(`/${existingUser.id}/todo`);
        }
      } else {
        // User does not exist
        if (isOrgLogin) {
          const newOrgId = 'org_' + Date.now();
          const newUserObj = {
            id: fbUser.uid,
            orgId: newOrgId,
            role: 'org' as const,
            name: fbUser.displayName || 'Org Admin',
            email: fbUser.email || '',
            avatar: fbUser.displayName ? fbUser.displayName.charAt(0).toUpperCase() : 'O',
            color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
            modules: ['todo', 'habits'] as any
          };
          
          await addUser(newUserObj);
          router.push(`/org/todo`);
        } else {
          setErrorMsg("You need an invite link to join an existing organization as an individual.");
          await auth.signOut();
        }
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      setErrorMsg("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="landing-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="landing-hero" style={{ textAlign: 'center' }}>
        <h1>Your <span>Personal</span> Tracker</h1>
        <p>Manage your organization tasks or track your personal goals.</p>
        
        {errorMsg && (
          <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 8, fontSize: '0.9rem' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 32, justifyContent: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => handleSignIn(true)} 
            disabled={loading}
            style={{ fontSize: '1.1rem', padding: '12px 24px' }}
          >
            {loading ? 'Wait...' : '🏢 Sign in as Org'}
          </button>

          <button 
            className="btn btn-ghost" 
            onClick={() => handleSignIn(false)} 
            disabled={loading}
            style={{ fontSize: '1.1rem', padding: '12px 24px', border: '1px solid var(--border)' }}
          >
            👤 Sign in as Individual
          </button>
        </div>
      </div>
    </main>
  );
}
