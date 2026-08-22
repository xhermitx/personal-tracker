'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const user = state.users.find(u => u.id === userId);

  useEffect(() => {
    if (!user) {
      router.replace('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
