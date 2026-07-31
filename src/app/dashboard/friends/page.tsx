'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../stores/authStore';
import { useFriendStore } from '../../../stores/friendStore';
import { acceptFriendRequest, rejectFriendRequest, removeFriend, updateFriendNickname } from '../../../lib/firebase/friends';
import { getOrCreateConversation } from '../../../lib/firebase/messages';
import { InviteModal } from '../../../components/friends/InviteModal';
import { UserPlus, UserCheck, UserX, UserMinus, MessageSquare, Edit2, Check, X } from 'lucide-react';
import { useTranslation } from '../../../lib/i18n';
import { showConfirm, showAlert } from '../../../stores/dialogStore';

export default function FriendsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { friends, friendRequests, loading } = useFriendStore();
  const { t, lang } = useTranslation();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [messagingFriendId, setMessagingFriendId] = useState<string | null>(null);
  const [editingNicknameId, setEditingNicknameId] = useState<string | null>(null);
  const [tempNickname, setTempNickname] = useState('');

  const handleAccept = async (request: any) => {
    try {
      await acceptFriendRequest(request);
    } catch (err: any) {
      showAlert((lang === 'en' ? 'Accept failed: ' : '接受失敗: ') + err.message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
    } catch (err: any) {
      showAlert((lang === 'en' ? 'Reject failed: ' : '拒絕失敗: ') + err.message);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user || !await showConfirm(t('friends.removeConfirm'))) return;
    try {
      await removeFriend(user.uid, friendId);
    } catch (err: any) {
      showAlert((lang === 'en' ? 'Remove failed: ' : '刪除失敗: ') + err.message);
    }
  };

  const handleMessage = async (friend: any) => {
    if (!user) return;
    setMessagingFriendId(friend.uid);
    try {
      await getOrCreateConversation(
        user.uid, user.nickname || t('friends.unknownUser'), user.avatarUrl || null,
        friend.uid, friend.nickname, friend.avatarUrl || null
      );
      router.push('/dashboard/messages');
    } catch (err: any) {
      showAlert((lang === 'en' ? 'Failed to start chat: ' : '建立聊天失敗: ') + err.message);
    } finally {
      setMessagingFriendId(null);
    }
  };

  const handleStartEditNickname = (friend: any) => {
    setEditingNicknameId(friend.uid);
    setTempNickname(user?.friendNicknames?.[friend.uid] || friend.nickname);
  };

  const handleSaveNickname = async (friendId: string) => {
    if (!user) return;
    try {
      await updateFriendNickname(user.uid, friendId, tempNickname);
      setEditingNicknameId(null);
    } catch (err: any) {
      showAlert((lang === 'en' ? 'Save nickname failed: ' : '儲存暱稱失敗: ') + err.message);
    }
  };

  return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{lang === 'en' ? 'Friends & Sharing' : '好友與共用'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {lang === 'en' ? 'Add friends to share tasks and notes with them.' : '新增好友後，您可以在任務和記事中與他們共用內容。'}
            </p>
          </div>
          <button onClick={() => setShowInviteModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} /> {lang === 'en' ? 'Add Friend' : '新增好友'}
          </button>
        </div>

        {/* Pending Requests */}
        {friendRequests.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>{t('friends.requestsTitle')}</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {friendRequests.map(req => (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--border)', overflow: 'hidden' }}>
                      {req.fromUserAvatar ? <img src={req.fromUserAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>?</div>}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600 }}>{req.fromUserNickname}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'en' ? 'wants to be your friend' : '想加您為好友'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleAccept(req)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--primary)', color: '#fff', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={16} /> {t('friends.accept')}
                    </button>
                    <button onClick={() => handleReject(req.id)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserX size={16} /> {t('friends.reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>{lang === 'en' ? `My Friends (${friends.length})` : `我的好友 (${friends.length})`}</h2>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>{t('common.loading')}</p>
          ) : friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</p>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{lang === 'en' ? 'No friends yet' : '目前還沒有好友'}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {lang === 'en' ? 'Click "Add Friend" at the top right to invite friends!' : '點擊右上角的「新增好友」來邀請朋友加入吧！'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {friends.map(friend => {
                const displayNickname = user?.friendNicknames?.[friend.uid] || friend.nickname;
                const isEditing = editingNicknameId === friend.uid;
                
                return (
                <div key={friend.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--border)', overflow: 'hidden' }}>
                      {friend.avatarUrl ? <img src={friend.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>{friend.nickname.charAt(0).toUpperCase()}</div>}
                    </div>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <input 
                          type="text" 
                          value={tempNickname} 
                          onChange={(e) => setTempNickname(e.target.value)}
                          placeholder={friend.nickname}
                          style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.875rem' }}
                          autoFocus
                        />
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{friend.email}</p>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontWeight: 600 }}>
                          {displayNickname}
                          {user?.friendNicknames?.[friend.uid] && (
                            <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px' }}>
                              {lang === 'en' ? 'Custom' : '自訂'}
                            </span>
                          )}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{friend.email}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSaveNickname(friend.uid)} title={t('common.save')} style={{ color: 'var(--primary)', padding: '0.5rem', background: 'transparent', border: 'none' }}><Check size={18} /></button>
                        <button onClick={() => setEditingNicknameId(null)} title={t('common.cancel')} style={{ color: 'var(--text-muted)', padding: '0.5rem', background: 'transparent', border: 'none' }}><X size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleStartEditNickname(friend)} title={lang === 'en' ? 'Set Nickname' : '設定暱稱'} style={{ color: 'var(--text-main)', padding: '0.5rem', background: 'transparent', border: 'none' }}><Edit2 size={18} /></button>
                        <button 
                          onClick={() => handleMessage(friend)} 
                          title={lang === 'en' ? 'Send Message' : '發送訊息'} 
                          style={{ color: 'var(--primary)', padding: '0.5rem', background: 'transparent', border: 'none' }}
                          disabled={messagingFriendId === friend.uid}
                        >
                          <MessageSquare size={18} />
                        </button>
                        <button onClick={() => handleRemoveFriend(friend.uid)} title={t('friends.remove')} style={{ color: 'var(--text-muted)', padding: '0.5rem', background: 'transparent', border: 'none' }}>
                          <UserMinus size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
      </div>
  );
}
