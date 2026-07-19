'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerWithEmail, loginWithGoogle } from '../../../lib/firebase/auth';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerWithEmail(email, password, nickname);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '註冊失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      setError('Google 註冊/登入失敗。');
    }
  };

  return (
    <div className="card">
      <div className="text-center mb-4">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>建立新帳號</h1>
        <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>加入 FreeNote 提升您的生產力</p>
      </div>

      <form onSubmit={handleRegister}>
        <div className="input-group">
          <label htmlFor="nickname">暱稱 Nickname</label>
          <input 
            id="nickname" 
            type="text" 
            required 
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="您的名字或暱稱" 
          />
        </div>
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 個字元" 
          />
        </div>

        {error && <div className="form-error mb-4">{error}</div>}

        <button type="submit" className="btn-primary mb-4" disabled={loading}>
          <UserPlus size={20} />
          {loading ? '註冊中...' : '註冊'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
        <span style={{ padding: '0 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>或</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
      </div>

      <button type="button" className="btn-outline mb-4" onClick={handleGoogleLogin}>
        使用 Google 帳號註冊
      </button>

      <div className="text-center text-sm">
        <span style={{ color: 'var(--text-muted)' }}>已經有帳號了？ </span>
        <Link href="/auth/login" className="text-primary" style={{ fontWeight: 500 }}>
          立即登入
        </Link>
      </div>
    </div>
  );
}
