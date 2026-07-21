import { create } from 'zustand';
import { Conversation, Message } from '../types';

interface MessageState {
  conversations: Conversation[];
  messages: Record<string, Message[]>; // keyed by conversationId
  activeConversationId: string | null;
  loading: boolean;
  initialized: boolean;
  setConversations: (convos: Conversation[]) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setActiveConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (init: boolean) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  conversations: [],
  messages: {},
  activeConversationId: null,
  loading: false,
  initialized: false,
  setConversations: (conversations) => set({ conversations }),
  setMessages: (conversationId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: msgs } })),
  addMessage: (conversationId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] || []), message],
      },
    })),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (init) => set({ initialized: init }),
}));
