'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import OrgSidebar from '@/components/OrgSidebar';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const router = useRouter();
  const [authLoaded, setAuthLoaded] = useState(false);
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      setAuthLoaded(true);
    });
    return unsub;
  }, []);

  const currentUser = state.users.find(u => 
    u.id === auth.currentUser?.uid || (u.email && u.email === auth.currentUser?.email)
  );

  useEffect(() => {
    if (!authLoaded) return;
    if (!auth.currentUser) {
      router.replace('/');
      return;
    }
    // Wait for users to load
    if (state.users.length === 0) return;
    
    // If the users array is loaded but this user is not in it yet, wait (they might have just signed up)
    if (!currentUser) return;
    
    if (currentUser.role !== 'org') {
      router.replace('/');
    }
  }, [authLoaded, currentUser, state.users, router]);

  // Don't render until we confirm they are an org
  if (!authLoaded || !auth.currentUser || !currentUser || currentUser.role !== 'org') {
    return null;
  }

  return (
    <div className="app-layout">
      <OrgSidebar />
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
