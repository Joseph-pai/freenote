'use client';
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      // If user is not authenticated and trying to access protected routes, redirect to login
      if (!pathname.startsWith('/auth')) {
        router.push('/auth/login');
      }
    } else if (!loading && user) {
      // If user is authenticated and trying to access auth routes, redirect to dashboard
      if (pathname.startsWith('/auth')) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>載入中 Loading...</p>
      </div>
    );
  }

  // Hide children while redirecting to avoid flash of content
  if (!user && !pathname.startsWith('/auth')) return null;
  if (user && pathname.startsWith('/auth')) return null;

  return <>{children}</>;
}
