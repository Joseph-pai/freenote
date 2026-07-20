'use client';
import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { subscribeToConversations, subscribeToMessages } from '../../lib/firebase/messages';
import { useMessageStore } from '../../stores/messageStore';

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { conversations, activeConversationId } = useMessageStore();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!activeConversationId) return;
    const unsub = subscribeToMessages(activeConversationId);
    return () => unsub();
  }, [activeConversationId]);

  return <>{children}</>;
}
