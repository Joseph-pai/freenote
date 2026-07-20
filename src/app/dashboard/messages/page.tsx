'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useMessageStore } from '../../../stores/messageStore';
import { sendMessage, markMessagesAsRead } from '../../../lib/firebase/messages';
import { MessageProvider } from '../../../components/messages/MessageProvider';
import { Send, MessageSquare } from 'lucide-react';

function ConversationItem({
  conversation,
  active,
  onClick,
  currentUserId,
  unreadCount
}: {
  conversation: any;
  active: boolean;
  onClick: () => void;
  currentUserId: string;
  unreadCount: number;
}) {
  const otherUserId = conversation.participants.find((id: string) => id !== currentUserId) || currentUserId;
  const otherNickname = conversation.participantNicknames[otherUserId] || '未知用戶';
  const otherAvatar = conversation.participantAvatars[otherUserId];

  const date = new Date(conversation.lastMessageAt).toLocaleDateString('zh-TW', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{date}</span>
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
          fontSize: '0.75rem', fontWeight: 600,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = activeConversationId ? (messages[activeConversationId] || []) : [];

  // Scroll to bottom
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
      await sendMessage(activeConversationId, user.uid, inputText.trim());
      setInputText('');
    } catch (err: any) {
      alert('發送失敗: ' + err.message);
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
                />
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
        {!activeConversationId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💬</p>
              <p style={{ fontWeight: 600 }}>選擇一個對話開始聊天</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeMessages.map((msg, idx) => {
                const isMe = msg.senderId === user.uid;
                const time = new Date(msg.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%',
                      background: isMe ? 'var(--primary)' : 'var(--surface)',
                      color: isMe ? '#fff' : 'var(--text-main)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-lg)',
                      borderBottomRightRadius: isMe ? '4px' : 'var(--radius-lg)',
                      borderBottomLeftRadius: isMe ? 'var(--radius-lg)' : '4px',
                      boxShadow: 'var(--shadow-sm)',
                      wordBreak: 'break-word',
                    }}>
                      <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{msg.text}</p>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px', margin: '0 4px' }}>
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
