'use client';
import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { subscribeToTasks, flushSyncQueue } from '../../lib/firebase/tasks';

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Flush any queued offline operations first
    flushSyncQueue().catch(() => {});

    // Subscribe to realtime task updates
    const unsubscribe = subscribeToTasks(user.uid);

    // Listen for online event to flush queue
    const handleOnline = () => flushSyncQueue().catch(() => {});
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

  return <>{children}</>;
}
