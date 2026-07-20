'use client';
import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { subscribeToEvents } from '../../lib/firebase/events';

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToEvents(user.uid);
    return () => unsubscribe();
  }, [user]);

  return <>{children}</>;
}
