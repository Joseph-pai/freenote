import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  onSnapshot, query, where, orderBy, limit, arrayUnion, writeBatch, deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import { Conversation, Message } from '../../types';
import { useMessageStore } from '../../stores/messageStore';

export const subscribeToConversations = (userId: string) => {
  const { setConversations, setLoading } = useMessageStore.getState();
  setLoading(true);

  // No orderBy to avoid composite index requirement — sort client-side
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const convos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
    // Sort by lastMessageAt descending on the client side
    convos.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    setConversations(convos);
    setLoading(false);
  }, () => {
    setLoading(false);
  });
};

export const subscribeToMessages = (conversationId: string) => {
  const { setMessages } = useMessageStore.getState();

  // No orderBy to avoid composite index requirement — sort client-side
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId)
  );

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    // Sort by createdAt ascending on the client side
    msgs.sort((a, b) => a.createdAt - b.createdAt);
    setMessages(conversationId, msgs);
  });
};

export const sendMessage = async (conversationId: string, senderId: string, senderNickname: string, text: string) => {
  const now = Date.now();
  const messageData: Omit<Message, 'id'> = {
    conversationId,
    senderId,
    senderNickname,
    text,
    createdAt: now,
    readBy: [senderId],
  };

  const batch = writeBatch(db);
  
  // Create message
  const msgRef = doc(collection(db, 'messages'));
  batch.set(msgRef, messageData);

  // Update conversation lastMessage
  const convRef = doc(db, 'conversations', conversationId);
  batch.update(convRef, {
    lastMessage: text,
    lastMessageAt: now
  });

  await batch.commit();
};

export const deleteMessage = async (messageId: string) => {
  await deleteDoc(doc(db, 'messages', messageId));
};

export const deleteConversation = async (conversationId: string) => {
  // Delete all messages in this conversation
  const q = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
  const snap = await getDocs(q);
  
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'conversations', conversationId));
  await batch.commit();
};

export const getOrCreateConversation = async (
  userId1: string, nickname1: string, avatar1: string | null,
  userId2: string, nickname2: string, avatar2: string | null
): Promise<string> => {
  // Try to find existing
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId1)
  );
  
  const snap = await getDocs(q);
  const existing = snap.docs.find(d => {
    const data = d.data();
    return data.participants.includes(userId2);
  });

  if (existing) {
    return existing.id;
  }

  // Create new
  const now = Date.now();
  const convData: Omit<Conversation, 'id'> = {
    participants: [userId1, userId2],
    participantNicknames: {
      [userId1]: nickname1,
      [userId2]: nickname2
    },
    participantAvatars: {
      [userId1]: avatar1,
      [userId2]: avatar2
    },
    lastMessage: '開始對話',
    lastMessageAt: now,
    createdAt: now
  };

  const ref = await addDoc(collection(db, 'conversations'), convData);
  return ref.id;
};

export const markMessagesAsRead = async (conversationId: string, userId: string, messages: Message[]) => {
  const unreadMessages = messages.filter(m => !m.readBy.includes(userId));
  if (unreadMessages.length === 0) return;

  const batch = writeBatch(db);
  unreadMessages.forEach(msg => {
    const ref = doc(db, 'messages', msg.id);
    batch.update(ref, {
      readBy: arrayUnion(userId)
    });
  });

  await batch.commit();
};
