'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginWithEmail, loginWithGoogle } from '../../../lib/firebase/auth';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      router.push('/dashboard/calendar');
    } catch (err: any) {
      setError(err.message || '登入失敗，請檢查帳號密碼。');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      router.push('/dashboard/calendar');
    } catch (err: any) {
      setError('Google 登入失敗。');
    }
  };

  return (
    <div className="card">
      <div className="text-center mb-4">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>歡迎回來 FreeNote</h1>
        <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>登入以繼續管理您的工作與記事</p>
      </div>

      <form onSubmit={handleEmailLogin}>
        <div className="input-group">
          <label htmlFor="email">電子郵件 Email</label>
          <input 
            id="email" 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com" 
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">密碼 Password</label>
          <input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
          />
        </div>

        {error && <div className="form-error mb-4">{error}</div>}

        <button type="submit" className="btn-primary mb-4" disabled={loading}>
          <LogIn size={20} />
          {loading ? '登入中...' : '登入'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
        <span style={{ padding: '0 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>或</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
      </div>

      <button type="button" className="btn-outline mb-4" onClick={handleGoogleLogin}>
        使用 Google 帳號登入
      </button>

      <div className="text-center text-sm">
        <span style={{ color: 'var(--text-muted)' }}>還沒有帳號？ </span>
        <Link href="/auth/register" className="text-primary" style={{ fontWeight: 500 }}>
          立即註冊
        </Link>
      </div>
    </div>
  );
}
