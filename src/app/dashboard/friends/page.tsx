'use client';
import React, { useState } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useFriendStore } from '../../../stores/friendStore';
import { acceptFriendRequest, rejectFriendRequest, removeFriend } from '../../../lib/firebase/friends';
import { FriendProvider } from '../../../components/friends/FriendProvider';
import { InviteModal } from '../../../components/friends/InviteModal';
import { UserPlus, UserCheck, UserX, UserMinus } from 'lucide-react';

export default function FriendsPage() {
  const { user } = useAuthStore();
  const { friends, friendRequests, loading } = useFriendStore();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleAccept = async (request: any) => {
    try {
      await acceptFriendRequest(request);
    } catch (err: any) {
      alert('接受失敗: ' + err.message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
    } catch (err: any) {
      alert('拒絕失敗: ' + err.message);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user || !confirm('確定要解除好友關係嗎？解除後將無法繼續共用任務或記事。')) return;
    try {
      await removeFriend(user.uid, friendId);
    } catch (err: any) {
      alert('刪除失敗: ' + err.message);
    }
  };

  return (
    <FriendProvider>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>好友與共用</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>新增好友後，您可以在任務和記事中與他們共用內容。</p>
          </div>
          <button onClick={() => setShowInviteModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} /> 新增好友
          </button>
        </div>

        {/* Pending Requests */}
        {friendRequests.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>待處理的好友邀請</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {friendRequests.map(req => (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border)', overflow: 'hidden' }}>
                      {req.fromUserAvatar ? <img src={req.fromUserAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>?</div>}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600 }}>{req.fromUserNickname}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>想加您為好友</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleAccept(req)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: '#fff', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={16} /> 接受
                    </button>
                    <button onClick={() => handleReject(req.id)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserX size={16} /> 拒絕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>我的好友 ({friends.length})</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>載入中...</p>
          ) : friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</p>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>目前還沒有好友</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>點擊右上角的「新增好友」來邀請朋友加入吧！</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {friends.map(friend => (
                <div key={friend.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--border)', overflow: 'hidden' }}>
                      {friend.avatarUrl ? <img src={friend.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{friend.nickname.charAt(0).toUpperCase()}</div>}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600 }}>{friend.nickname}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{friend.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveFriend(friend.uid)} title="解除好友" style={{ color: 'var(--text-muted)', padding: '0.5rem' }}>
                    <UserMinus size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
      </div>
    </FriendProvider>
  );
}
