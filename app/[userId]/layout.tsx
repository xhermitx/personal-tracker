'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      setAuthLoaded(true);
    });
    return unsub;
  }, []);

  // In case they have an old random ID but the URL matches, OR we check their auth email
  const user = state.users.find(u => 
    u.id === userId || (auth.currentUser && u.email === auth.currentUser.email)
  );

  useEffect(() => {
    if (!authLoaded) return;
    if (!auth.currentUser) {
      router.replace('/');
      return;
    }
    if (state.users.length === 0) return;
    // Wait for the specific user to appear in the state (they might have just signed up)
    if (!user && auth.currentUser.uid === userId) return;
    
    // If the URL userId doesn't match a loaded user, and it's not the currently authenticating user
    if (!user) {
      router.replace('/');
    }
  }, [authLoaded, user, state.users, router, userId]);

  if (!authLoaded || !auth.currentUser || !user) return null;

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
