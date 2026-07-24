'use client';
import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { generateInviteCode, useInviteCode } from '../../lib/firebase/friends';

interface InviteModalProps {
  onClose: () => void;
}

export function InviteModal({ onClose }: InviteModalProps) {
  const { user } = useAuthStore();
  
  const [mode, setMode] = useState<'generate' | 'use'>('generate');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const invite = await generateInviteCode(user.uid);
      setGeneratedCode(invite.code);
    } catch (err: any) {
      setError('產生失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await useInviteCode(inviteCode.trim(), user.uid, user.nickname || '未知用戶', user.avatarUrl);
      setSuccess('加入成功！對方已新增至您的好友列表。');
      setInviteCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ marginBottom: '1.25rem', fontWeight: 700, fontSize: '1.125rem', textAlign: 'center' }}>
          好友邀請
        </h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--border)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => { setMode('generate'); setError(''); setSuccess(''); }}
            style={{ flex: 1, padding: '6px', borderRadius: 'var(--radius-sm)', background: mode === 'generate' ? 'var(--surface)' : 'transparent', color: mode === 'generate' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: mode === 'generate' ? 600 : 400 }}
          >
            產生邀請碼
          </button>
          <button
            onClick={() => { setMode('use'); setError(''); setSuccess(''); }}
            style={{ flex: 1, padding: '6px', borderRadius: 'var(--radius-sm)', background: mode === 'use' ? 'var(--surface)' : 'transparent', color: mode === 'use' ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: mode === 'use' ? 600 : 400 }}
          >
            輸入邀請碼
          </button>
        </div>

        {error && <p style={{ color: 'var(--priority-high)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: '#10b981', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>{success}</p>}

        {mode === 'generate' ? (
          <div style={{ textAlign: 'center' }}>
            {generatedCode ? (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>您的專屬邀請碼 (48小時內有效)：</p>
                <div style={{ padding: '1rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--primary)' }}>
                  {generatedCode}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>將此邀請碼發送給朋友，對方輸入後即可直接成為您的好友。</p>
              </div>
            ) : (
              <button onClick={handleGenerate} className="btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }} disabled={loading}>
                {loading ? '產生中...' : '產生一次性邀請碼'}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleUseCode}>
            <div className="input-group">
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="輸入 8 碼邀請碼..."
                style={{ textAlign: 'center', fontSize: '1.125rem', letterSpacing: '1px' }}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || !inviteCode}>
              {loading ? '加入中...' : '加入好友'}
            </button>
          </form>
        )}

        <button type="button" onClick={onClose} style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 600 }}>
          關閉
        </button>
      </div>
    </div>
  );
}
