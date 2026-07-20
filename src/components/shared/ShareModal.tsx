'use client';
import React, { useState } from 'react';
import { useFriendStore } from '../../stores/friendStore';
import { Users, X } from 'lucide-react';

interface ShareModalProps {
  itemId: string;
  itemType: 'task' | 'note' | 'event';
  currentSharedWith: Record<string, 'view' | 'edit'>;
  onSave: (newSharedWith: Record<string, 'view' | 'edit'>, newSharedUserIds: string[]) => Promise<void>;
  onClose: () => void;
}

export function ShareModal({ itemId, itemType, currentSharedWith, onSave, onClose }: ShareModalProps) {
  const { friends } = useFriendStore();
  const [shared, setShared] = useState<Record<string, 'view' | 'edit'>>(currentSharedWith || {});
  const [loading, setLoading] = useState(false);

  const handleToggleFriend = (uid: string) => {
    setShared(prev => {
      const next = { ...prev };
      if (next[uid]) {
        delete next[uid];
      } else {
        next[uid] = 'view';
      }
      return next;
    });
  };

  const handleSetRole = (uid: string, role: 'view' | 'edit') => {
    setShared(prev => ({ ...prev, [uid]: role }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const newSharedUserIds = Object.keys(shared);
      await onSave(shared, newSharedUserIds);
      onClose();
    } catch (err: any) {
      alert('儲存失敗: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} /> 共用設定
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        {friends.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', margin: '2rem 0' }}>您還沒有新增好友，請先前往「好友」頁面新增。</p>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>選擇要共用的好友：</p>
            {friends.map((friend) => {
              const isShared = !!shared[friend.uid];
              const role = shared[friend.uid];
              return (
                <div key={friend.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', background: isShared ? 'rgba(37,99,235,0.06)' : 'transparent', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }} onClick={() => handleToggleFriend(friend.uid)}>
                    <input type="checkbox" checked={isShared} onChange={() => handleToggleFriend(friend.uid)} style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: isShared ? 'var(--primary)' : 'var(--text-main)' }}>{friend.nickname}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{friend.email}</p>
                    </div>
                  </div>
                  {isShared && (
                    <select
                      value={role}
                      onChange={(e) => handleSetRole(friend.uid, e.target.value as 'view' | 'edit')}
                      style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', fontSize: '0.8125rem', outline: 'none' }}
                    >
                      <option value="view">可檢視</option>
                      <option value="edit">可編輯</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
          <button onClick={handleSave} className="btn-primary" style={{ flex: 1 }} disabled={loading}>
            {loading ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </div>
    </div>
  );
}
