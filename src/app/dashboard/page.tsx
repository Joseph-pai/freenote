'use client';
import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { logout } from '../../lib/firebase/auth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        歡迎回來，{user?.nickname}
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        您的個人任務與記事
      </p>
      
      <button onClick={handleLogout} className="btn-outline" style={{ maxWidth: '200px' }}>
        登出
      </button>
    </div>
  );
}
