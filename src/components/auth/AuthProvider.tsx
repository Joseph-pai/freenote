'use client';
import React, { useEffect } from 'react';
import { initAuthListener } from '../../lib/firebase/auth';
import ProtectedRoute from './ProtectedRoute';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize the Firebase auth listener on app start
    const unsubscribe = initAuthListener();
    return () => {
      // Cleanup the listener when the component unmounts
      unsubscribe();
    };
  }, []);

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
