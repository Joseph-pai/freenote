'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useMessageStore } from '../../../stores/messageStore';
import { useFriendStore } from '../../../stores/friendStore';
import { sendMessage, markMessagesAsRead, deleteMessage, subscribeToMessages, createGroupConversation, updateGroupName, addGroupParticipants, removeGroupParticipant, updateGroupMemberNickname } from '../../../lib/firebase/messages';
import { Send, MessageSquare, Trash2, ArrowLeft, Users, Edit2, Paperclip, FileText, Check, X, Plus, Settings, UserPlus, UserMinus } from 'lucide-react';
import { getWebRTCManager, saveFileToDisk, WebRTCManager } from '../../../lib/webrtc/webrtc';
import { useTranslation } from '../../../lib/i18n';

function ConversationItem({
  conversation,
  active,
  onClick,
  currentUserId,
  unreadCount,
  userFriendNicknames
}: {
  conversation: any;
  active: boolean;
  onClick: () => void;
  currentUserId: string;
  unreadCount: number;
  userFriendNicknames?: Record<string, string>;
}) {
  const { t, lang } = useTranslation();
  const otherUserId = conversation.participants.find((id: string) => id !== currentUserId) || currentUserId;
  const otherNickname = userFriendNicknames?.[otherUserId] || conversation.participantNicknames[otherUserId] || t('friends.unknownUser');
  const otherAvatar = conversation.participantAvatars[otherUserId];

  const date = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-TW', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : '';

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        padding: '1rem',
        background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
        borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
        borderBottom: '1px solid var(--border)',
        display: 'flex', gap: '0.75rem', alignItems: 'center',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: 'var(--primary)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: '1.25rem', flexShrink: 0,
        overflow: 'hidden'
      }}>
        {otherAvatar ? (
          <img src={otherAvatar} alt={otherNickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          otherNickname.charAt(0).toUpperCase()
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {conversation.isGroup && <Users size={14} />} {conversation.isGroup ? conversation.groupName : otherNickname}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '4px' }}>{date}</span>
        </div>
        <p style={{
          fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontWeight: unreadCount > 0 ? 600 : 400
        }}>
          {conversation.lastMessage}
        </p>
      </div>
      {unreadCount > 0 && (
        <div style={{
          background: 'var(--primary)', color: '#fff',
          borderRadius: '99px', padding: '2px 8px',
          fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
        }}>
          {unreadCount}
        </div>
      )}
    </button>
  );
}

function MessagesContent() {
  const { user } = useAuthStore();
  const { conversations, messages, activeConversationId, setActiveConversationId, loading } = useMessageStore();
  const { friends } = useFriendStore();
  const { t, lang } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createGroupName, setCreateGroupName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Group member management state
  const [isManagingGroup, setIsManagingGroup] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberNickname, setEditingMemberNickname] = useState('');
  const [addMemberFriendIds, setAddMemberFriendIds] = useState<string[]>([]);
  
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && activeConversationId) {
      const manager = getWebRTCManager(user.uid);
      webrtcManagerRef.current = manager;
    }
    return () => {
      webrtcManagerRef.current = null;
    };
  }, [activeConversationId, user]);

  const [listWidth, setListWidth] = useState(280);
  const isResizing = useRef(false);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((clientX: number) => {
    if (isResizing.current && listRef.current) {
      const rect = listRef.current.getBoundingClientRect();
      const newWidth = Math.min(Math.max(clientX - rect.left, 200), 500);
      setListWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => resize(e.clientX);
    const handleTouchMove = (e: TouchEvent) => resize(e.touches[0].clientX);
    const handleMouseUp = () => stopResizing();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [resize, stopResizing]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activeMessages = activeConversationId ? (messages[activeConversationId] || []) : [];

  // Subscribe to messages when conversation changes
  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    if (activeConversationId) {
      unsubRef.current = subscribeToMessages(activeConversationId);
    }
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [activeConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Mark as read
  useEffect(() => {
    if (user && activeConversationId && activeMessages.length > 0) {
      markMessagesAsRead(activeConversationId, user.uid, activeMessages);
    }
  }, [activeMessages, activeConversationId, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConversationId || !inputText.trim()) return;

    try {
      await sendMessage(activeConversationId, user.uid, user.nickname || t('friends.unknownUser'), inputText.trim());
      setInputText('');
    } catch (err: any) {
      alert((lang === 'en' ? 'Failed to send: ' : '發送失敗: ') + err.message);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm(lang === 'en' ? 'Are you sure you want to delete this message?' : '確定要刪除這則訊息嗎？')) return;
    try {
      await deleteMessage(msgId);
    } catch (err: any) {
      alert((lang === 'en' ? 'Delete failed: ' : '刪除失敗: ') + err.message);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !createGroupName.trim() || selectedFriendIds.length === 0) return;
    
    try {
      const participantProfiles: Record<string, { nickname: string; avatar: string | null }> = {};
      selectedFriendIds.forEach(id => {
        const friend = friends.find(f => f.uid === id);
        if (friend) {
          participantProfiles[id] = {
            nickname: user.friendNicknames?.[id] || friend.nickname,
            avatar: friend.avatarUrl
          };
        }
      });
      
      const newConvId = await createGroupConversation(
        user.uid,
        user.nickname || t('friends.unknownUser'),
        user.avatarUrl,
        selectedFriendIds,
        participantProfiles,
        createGroupName.trim()
      );
      setIsCreatingGroup(false);
      setCreateGroupName('');
      setSelectedFriendIds([]);
      setActiveConversationId(newConvId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className={`layout-container ${activeConversationId ? 'show-detail' : 'show-list'}`} style={{ display: 'flex', height: '100%', margin: '-1.5rem', overflow: 'hidden' }}>
      
      {/* ── Conversation List Panel ── */}
      <div className="list-panel" ref={listRef} style={{
        width: `${listWidth}px`, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: 'var(--surface)',
        position: 'relative'
      }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <MessageSquare size={20} /> {t('nav.messages')}
          </h2>
          <button 
            onClick={() => setIsCreatingGroup(true)}
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: 'var(--primary)', 
              color: '#fff', 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
              transition: 'all 0.15s'
            }}
            title={lang === 'en' ? 'Create Group' : '建立群組'}
          >
            <Plus size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
             <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>{t('common.loading')}</p>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</p>
              <p style={{ fontSize: '0.875rem' }}>{lang === 'en' ? 'No conversations yet' : '還沒有對話'}</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{lang === 'en' ? 'Go to Friends page to start a chat' : '請到「好友」頁面發起聊天'}</p>
            </div>
          ) : (
            conversations.map(conv => {
              const msgs = messages[conv.id] || [];
              const unreadCount = msgs.filter(m => !m.readBy.includes(user.uid)).length;
              return (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  active={conv.id === activeConversationId}
                  onClick={() => setActiveConversationId(conv.id)}
                  currentUserId={user.uid}
                  unreadCount={unreadCount}
                  userFriendNicknames={user.friendNicknames}
                />
              );
            })
          )}
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          onTouchStart={startResizing}
          className="desktop-only"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '4px',
            height: '100%',
            cursor: 'col-resize',
            backgroundColor: 'var(--border)',
            zIndex: 10,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--border)')}
        />
      </div>

      {/* ── Chat Panel ── */}
      <div className="detail-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--background)', overflow: 'hidden', minWidth: 0 }}>
        {!activeConversationId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💬</p>
              <p style={{ fontWeight: 600 }}>{t('messages.selectChat')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            {activeConversation && (() => {
              const isGroup = activeConversation.isGroup;
              const displayName = isGroup ? activeConversation.groupName : (
                (() => {
                  const otherId = activeConversation.participants.find(id => id !== user.uid) || '';
                  return user.friendNicknames?.[otherId] || activeConversation.participantNicknames[otherId] || t('friends.unknownUser');
                })()
              );
              const displayAvatar = isGroup ? null : (
                (() => {
                  const otherId = activeConversation.participants.find(id => id !== user.uid) || '';
                  return activeConversation.participantAvatars?.[otherId];
                })()
              );
              
              const handleUpdateGroupName = async () => {
                if (!newGroupName.trim() || newGroupName === activeConversation.groupName) {
                  setIsEditingGroupName(false);
                  return;
                }
                try {
                  await updateGroupName(activeConversation.id, newGroupName.trim(), user.uid);
                  setIsEditingGroupName(false);
                } catch (err: any) {
                  alert(err.message);
                }
              };

              return (
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button 
                    className="mobile-only"
                    onClick={() => setActiveConversationId(null)}
                    style={{ padding: '4px', marginRight: '4px', color: 'var(--text-muted)' }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0, overflow: 'hidden' }}>
                    {isGroup ? <Users size={20} /> : displayAvatar ? (
                      <img src={displayAvatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      displayName?.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {isEditingGroupName ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={newGroupName} 
                        onChange={e => setNewGroupName(e.target.value)}
                        autoFocus
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      />
                      <button onClick={handleUpdateGroupName} style={{ color: 'var(--primary)' }}><Check size={18} /></button>
                      <button onClick={() => setIsEditingGroupName(false)} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem' }}>{displayName}</p>
                      {isGroup && activeConversation.adminId === user.uid && (
                        <>
                          <button 
                            onClick={() => { setNewGroupName(activeConversation.groupName || ''); setIsEditingGroupName(true); }}
                            style={{ color: 'var(--text-muted)', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            title={lang === 'en' ? 'Edit Group Name' : '修改群組名稱'}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => setIsManagingGroup(true)}
                            style={{ color: 'var(--text-muted)', padding: '4px', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                            title={lang === 'en' ? 'Manage Group Members' : '管理成員'}
                          >
                            <Settings size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Messages Area */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const file = e.dataTransfer.files[0];
                  if (user && activeConversation && webrtcManagerRef.current) {
                    const targetIds = activeConversation.participants.filter(id => id !== user.uid);
                    targetIds.forEach(targetId => {
                      webrtcManagerRef.current?.requestSendFile(targetId, activeConversation.id, file);
                    });
                    alert((lang === 'en' ? '⚠️ File request sent!\n\n🚨 IMPORTANT: Do NOT close or leave this page until the transfer is complete, otherwise it will be interrupted!' : '⚠️ 檔案傳送請求已發出！\n\n🚨 請注意：在對方接收完成前，【絕對不要】關閉或離開此畫面，否則傳輸將立刻中斷！'));
                  }
                }
              }}
              style={{ 
                flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                position: 'relative',
                background: isDraggingOver ? 'rgba(37,99,235,0.05)' : 'transparent',
                outline: isDraggingOver ? '2px dashed var(--primary)' : 'none',
                outlineOffset: '-8px',
                transition: 'all 0.2s'
              }}
            >
              {isDraggingOver && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.85)', zIndex: 20, pointerEvents: 'none' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {lang === 'en' ? 'Drop file here to send' : '放開以拖曳傳送檔案'}
                  </p>
                </div>
              )}
              {activeMessages.map((msg, idx) => {
                const isMe = msg.senderId === user.uid;
                const time = new Date(msg.createdAt).toLocaleTimeString(lang === 'en' ? 'en-US' : 'zh-TW', { hour: '2-digit', minute: '2-digit' });
                const showSender = !isMe && (idx === 0 || activeMessages[idx - 1].senderId !== msg.senderId);
                return (
                  <div
                    key={msg.id || idx}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}
                    onMouseEnter={() => setHoveredMsgId(msg.id)}
                    onMouseLeave={() => setHoveredMsgId(null)}
                  >
                    {showSender && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px', paddingLeft: '4px' }}>
                        {activeConversation?.groupMemberNicknames?.[msg.senderId] || user.friendNicknames?.[msg.senderId] || msg.senderNickname || t('friends.unknownUser')}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexDirection: isMe ? 'row-reverse' : 'row', width: '100%', maxWidth: '100%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '100%',
                        minWidth: '60px',
                        background: isMe ? 'var(--primary)' : 'var(--surface)',
                        color: isMe ? '#fff' : 'var(--text-main)',
                        padding: '0.625rem 0.875rem',
                        borderRadius: 'var(--radius-lg)',
                        borderBottomRightRadius: isMe ? '4px' : 'var(--radius-lg)',
                        borderBottomLeftRadius: isMe ? 'var(--radius-lg)' : '4px',
                        boxShadow: 'var(--shadow-sm)',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'left',
                      }}>
                        <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{msg.text}</p>
                      </div>
                      {/* Delete button - visible on hover */}
                      {hoveredMsgId === msg.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          style={{
                            color: 'var(--text-muted)', padding: '4px',
                            opacity: 0.7, flexShrink: 0,
                          }}
                          title={lang === 'en' ? 'Delete Message' : '刪除訊息'}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '4px', paddingRight: '4px' }}>
                      {time}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ cursor: 'pointer', color: 'var(--text-muted)', padding: '8px' }} title="Send P2P File">
                  <Paperclip size={20} />
                  <input type="file" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && user && activeConversation && webrtcManagerRef.current) {
                      const targetIds = activeConversation.participants.filter(id => id !== user.uid);
                      targetIds.forEach(targetId => {
                        webrtcManagerRef.current?.requestSendFile(targetId, activeConversation.id, file);
                      });
                      alert((lang === 'en' ? '⚠️ File request sent!\n\n🚨 IMPORTANT: Do NOT close or leave this page until the transfer is complete, otherwise it will be interrupted!' : '⚠️ 檔案傳送請求已發出！\n\n🚨 請注意：在對方接收完成前，【絕對不要】關閉或離開此畫面，否則傳輸將立刻中斷！'));
                    }
                    e.target.value = '';
                  }} />
                </label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('messages.placeholder')}
                  style={{
                    flex: 1, padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                    background: 'var(--background)', color: 'var(--text-main)',
                    fontSize: '0.9375rem', outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 1.25rem' }}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {isCreatingGroup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{lang === 'en' ? 'Create Group' : '建立群組'}</h3>
            <input 
              type="text" 
              placeholder={lang === 'en' ? 'Group Name' : '群組名稱'} 
              value={createGroupName}
              onChange={e => setCreateGroupName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)', fontSize: '0.9375rem', outline: 'none' }}
            />
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
              {friends.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>{lang === 'en' ? 'No friends found' : '沒有好友'}</p>
              ) : (
                friends.map(f => {
                  const friendName = user.friendNicknames?.[f.uid] || f.nickname;
                  const isSelected = selectedFriendIds.includes(f.uid);
                  return (
                    <label key={f.uid} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedFriendIds(prev => prev.filter(id => id !== f.uid));
                          } else {
                            setSelectedFriendIds(prev => [...prev, f.uid]);
                          }
                        }}
                      />
                      <span style={{ fontSize: '0.9375rem' }}>{friendName}</span>
                    </label>
                  );
                })
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => { setIsCreatingGroup(false); setCreateGroupName(''); setSelectedFriendIds([]); }} className="btn-secondary">{t('common.cancel')}</button>
              <button 
                onClick={handleCreateGroup} 
                className="btn-primary"
                disabled={!createGroupName.trim() || selectedFriendIds.length === 0}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Group Members Modal */}
      {isManagingGroup && activeConversation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{lang === 'en' ? 'Group Members Management' : '成員管理'}</h3>
              <button onClick={() => setIsManagingGroup(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Current Members List */}
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                {lang === 'en' ? 'Current Members' : '現有成員'} ({activeConversation.participants.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
                {activeConversation.participants.map((memberId: string) => {
                  const isAdmin = memberId === activeConversation.adminId;
                  const currentNickname = activeConversation.groupMemberNicknames?.[memberId] || activeConversation.participantNicknames?.[memberId] || user.friendNicknames?.[memberId] || '成員';
                  const isEditingThis = editingMemberId === memberId;

                  return (
                    <div key={memberId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--background)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{currentNickname}</span>
                        {isAdmin && (
                          <span style={{ fontSize: '0.7rem', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                            {lang === 'en' ? 'Admin' : '管理員'}
                          </span>
                        )}
                      </div>

                      {/* Admin Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isEditingThis ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              value={editingMemberNickname} 
                              onChange={e => setEditingMemberNickname(e.target.value)}
                              style={{ width: '100px', padding: '2px 6px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                            />
                            <button onClick={async () => {
                              try {
                                await updateGroupMemberNickname(activeConversation.id, memberId, editingMemberNickname, user.uid);
                                setEditingMemberId(null);
                              } catch (e: any) { alert(e.message); }
                            }} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}><Check size={16} /></button>
                            <button onClick={() => setEditingMemberId(null)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingMemberId(memberId); setEditingMemberNickname(currentNickname); }} title={lang === 'en' ? 'Edit Member Nickname' : '修改暱稱'} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Edit2 size={14} />
                          </button>
                        )}

                        {!isAdmin && (
                          <button onClick={async () => {
                            if (confirm(lang === 'en' ? 'Remove member from group?' : '確定要踢出此成員？')) {
                              try {
                                await removeGroupParticipant(activeConversation.id, memberId, user.uid);
                              } catch (e: any) { alert(e.message); }
                            }
                          }} title={lang === 'en' ? 'Remove Member' : '踢出群組'} style={{ color: 'var(--danger, #ef4444)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <UserMinus size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Members Section */}
            {(() => {
              const nonMemberFriends = friends.filter(f => !activeConversation.participants.includes(f.uid));
              if (nonMemberFriends.length === 0) return null;

              return (
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {lang === 'en' ? 'Add Friends to Group' : '邀請好友加入'}
                  </p>
                  <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
                    {nonMemberFriends.map(f => {
                      const friendName = user.friendNicknames?.[f.uid] || f.nickname;
                      const isSelected = addMemberFriendIds.includes(f.uid);
                      return (
                        <label key={f.uid} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setAddMemberFriendIds(prev => prev.filter(id => id !== f.uid));
                              } else {
                                setAddMemberFriendIds(prev => [...prev, f.uid]);
                              }
                            }}
                          />
                          <span style={{ fontSize: '0.875rem' }}>{friendName}</span>
                        </label>
                      );
                    })}
                  </div>

                  {addMemberFriendIds.length > 0 && (
                    <button 
                      onClick={async () => {
                        try {
                          const profiles: Record<string, { nickname: string; avatar: string | null }> = {};
                          addMemberFriendIds.forEach(id => {
                            const friend = friends.find(f => f.uid === id);
                            if (friend) {
                              profiles[id] = { nickname: user.friendNicknames?.[id] || friend.nickname, avatar: friend.avatarUrl };
                            }
                          });
                          await addGroupParticipants(activeConversation.id, addMemberFriendIds, profiles, user.uid);
                          setAddMemberFriendIds([]);
                        } catch (e: any) { alert(e.message); }
                      }} 
                      className="btn-primary" 
                      style={{ marginTop: '10px', width: '100%', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <UserPlus size={16} /> {lang === 'en' ? 'Add Selected Members' : '將勾選的好友加入群組'}
                    </button>
                  )}
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
}

export default function MessagesPage() {
  return <MessagesContent />;
}
