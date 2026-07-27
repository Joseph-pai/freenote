'use client';
import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, setLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Failsafe: if Firebase auth takes more than 10s (e.g. on older Safari/iOS),
  // force loading to false so the user sees the login page instead of infinite loading.
  useEffect(() => {
    if (loading) {
      loadingTimeoutRef.current = setTimeout(() => {
        setLoading(false);
      }, 10000);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loading, setLoading]);

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
