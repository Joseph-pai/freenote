'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { subscribeToConversations } from '../../lib/firebase/messages';
import { useMessageStore } from '../../stores/messageStore';
import { useRouter, usePathname } from 'next/navigation';

export function GlobalMessageListener() {
  const { user } = useAuthStore();
  const { conversations, activeConversationId, initialized } = useMessageStore();
  const router = useRouter();
  const pathname = usePathname();
  const prevConvsRef = useRef<Record<string, number>>({});
  const initialRecorded = useRef(false);
  
  const [toastMessage, setToastMessage] = useState<{ id: string, title: string, text: string, convId: string } | null>(null);

  // Global subscription to conversations
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid);
    return () => unsub();
  }, [user]);

  // Global listener for new messages
  useEffect(() => {
    if (!initialized) return;

    if (!initialRecorded.current) {
      // Record initial timestamps after first load
      const initialTimes: Record<string, number> = {};
      conversations.forEach(c => {
        initialTimes[c.id] = c.lastMessageAt;
      });
      prevConvsRef.current = initialTimes;
      initialRecorded.current = true;
      return;
    }

    // Check for updates
    let hasNew = false;
    const newTimes = { ...prevConvsRef.current };
    
    conversations.forEach(conv => {
      const prevTime = prevConvsRef.current[conv.id] || conv.createdAt;
      
      if (conv.lastMessageAt > prevTime) {
        // Only trigger toast if we are NOT actively viewing this conversation
        const isMessagesPage = pathname.startsWith('/dashboard/messages');
        if (!(isMessagesPage && activeConversationId === conv.id)) {
           // We also don't want to trigger if WE just sent it from somewhere else.
           // Since we can only send messages from the active conversation page currently,
           // if we are not actively in it, it MUST be from someone else.
           const otherUserId = conv.participants.find((id: string) => id !== user?.uid) || '';
           const senderName = user?.friendNicknames?.[otherUserId] || conv.participantNicknames[otherUserId] || '未知用戶';
           
           setToastMessage({
             id: Date.now().toString(),
             title: `新訊息來自 ${senderName}`,
             text: conv.lastMessage,
             convId: conv.id
           });

           // auto hide
           setTimeout(() => {
             setToastMessage(null);
           }, 5000);
        }
      }
      newTimes[conv.id] = conv.lastMessageAt;
    });

    prevConvsRef.current = newTimes;

  }, [conversations, initialized, activeConversationId, pathname, user]);

  if (!toastMessage) return null;

  return (
    <div 
      onClick={() => {
        router.push('/dashboard/messages');
        useMessageStore.getState().setActiveConversationId(toastMessage.convId);
        setToastMessage(null);
      }}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'var(--primary)',
        color: '#fff',
        padding: '1rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        cursor: 'pointer',
        minWidth: '250px',
        maxWidth: '350px',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.9375rem' }}>{toastMessage.title}</div>
      <div style={{ fontSize: '0.875rem', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toastMessage.text}</div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%) scale(0.95); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
