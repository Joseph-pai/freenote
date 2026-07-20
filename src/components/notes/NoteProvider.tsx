'use client';
import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { subscribeToNotes } from '../../lib/firebase/notes';

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotes(user.uid);
    return () => unsubscribe();
  }, [user]);

  return <>{children}</>;
}
