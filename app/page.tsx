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

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      // Check if user exists in our app state
      let existingUser = state.users.find(u => u.email === fbUser.email);
      
      if (!existingUser) {
        // Auto-create user profile if they don't exist
        const newUserObj = {
          orgId: state.currentOrgId || 'main-org',
          name: fbUser.displayName || 'New User',
          email: fbUser.email || '',
          avatar: fbUser.displayName ? fbUser.displayName.charAt(0).toUpperCase() : 'U',
          color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
          modules: ['todo', 'habits'] as any
        };
        
        await addUser(newUserObj);
        
        // Wait a tiny bit for state to update, or just redirect blindly based on what they should be
        // We'll just assume they'll load into the first user we find next time, but for now we'll route to admin or just wait.
        setTimeout(() => {
          router.push(`/admin`); // They can start by setting up their profile
        }, 1000);
      } else {
        const firstModule = existingUser.modules[0] ?? 'todo';
        router.push(`/${existingUser.id}/${firstModule}`);
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
      alert("Failed to sign in. Please check console for details (make sure you configured Firebase!).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="landing-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="landing-hero" style={{ textAlign: 'center' }}>
        <h1>Your <span>Personal</span> Tracker</h1>
        <p>Sign in with your Org account to track your goals & habits.</p>
        
        <button 
          className="btn btn-primary" 
          onClick={handleSignIn} 
          disabled={loading}
          style={{ marginTop: '20px', fontSize: '1.2rem', padding: '12px 24px' }}
        >
          {loading ? 'Signing In...' : 'Sign in with Google'}
        </button>
      </div>
    </main>
  );
}
