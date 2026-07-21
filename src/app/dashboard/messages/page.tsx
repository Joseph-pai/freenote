'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useMessageStore } from '../../../stores/messageStore';
import { sendMessage, markMessagesAsRead, deleteMessage, subscribeToMessages } from '../../../lib/firebase/messages';
import { MessageProvider } from '../../../components/messages/MessageProvider';
import { Send, MessageSquare, Trash2 } from 'lucide-react';

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
  const otherUserId = conversation.participants.find((id: string) => id !== currentUserId) || currentUserId;
  const otherNickname = userFriendNicknames?.[otherUserId] || conversation.participantNicknames[otherUserId] || '未知用戶';
  const otherAvatar = conversation.participantAvatars[otherUserId];

  const date = conversation.lastMessageAt
    ? new Date(conversation.lastMessageAt).toLocaleDateString('zh-TW', {
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
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {otherNickname}
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
  const [inputText, setInputText] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

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
      await sendMessage(activeConversationId, user.uid, user.nickname || '未知用戶', inputText.trim());
      setInputText('');
    } catch (err: any) {
      alert('發送失敗: ' + err.message);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('確定要刪除這則訊息嗎？')) return;
    try {
      await deleteMessage(msgId);
    } catch (err: any) {
      alert('刪除失敗: ' + err.message);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', height: '100%', margin: '-1.5rem', overflow: 'hidden' }}>
      
      {/* ── Conversation List Panel ── */}
      <div style={{
        width: '280px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--surface)',
      }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} /> 訊息
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
             <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>載入中...</p>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</p>
              <p style={{ fontSize: '0.875rem' }}>還沒有對話</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>請到「好友」頁面發起聊天</p>
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
      </div>

      {/* ── Chat Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--background)', overflow: 'hidden' }}>
        {!activeConversationId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💬</p>
              <p style={{ fontWeight: 600 }}>選擇一個對話開始聊天</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            {activeConversation && (() => {
              const otherId = activeConversation.participants.find(id => id !== user.uid) || '';
              const otherName = user.friendNicknames?.[otherId] || activeConversation.participantNicknames[otherId] || '未知用戶';
              return (
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
                    {otherName.charAt(0).toUpperCase()}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '1rem' }}>{otherName}</p>
                </div>
              );
            })()}

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeMessages.map((msg, idx) => {
                const isMe = msg.senderId === user.uid;
                const time = new Date(msg.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
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
                        {user.friendNicknames?.[msg.senderId] || msg.senderNickname || '未知用戶'}
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
                      {hoveredMsgId === msg.id && isMe && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          style={{
                            color: 'var(--text-muted)', padding: '4px',
                            opacity: 0.7, flexShrink: 0,
                          }}
                          title="刪除訊息"
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
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="輸入訊息..."
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

    </div>
  );
}

export default function MessagesPage() {
  return (
    <MessageProvider>
      <MessagesContent />
    </MessageProvider>
  );
}
