import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  onSnapshot, query, where, orderBy, limit, arrayUnion, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { Conversation, Message } from '../../types';
import { useMessageStore } from '../../stores/messageStore';

export const subscribeToConversations = (userId: string) => {
  const { setConversations, setLoading } = useMessageStore.getState();
  setLoading(true);

  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const convos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
    setConversations(convos);
    setLoading(false);
  });
};

export const subscribeToMessages = (conversationId: string) => {
  const { setMessages } = useMessageStore.getState();

  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    setMessages(conversationId, msgs);
  });
};

export const sendMessage = async (conversationId: string, senderId: string, text: string) => {
  const now = Date.now();
  const messageData: Omit<Message, 'id'> = {
    conversationId,
    senderId,
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
