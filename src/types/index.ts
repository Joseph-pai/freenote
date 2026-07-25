export interface AppUser {
  uid: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  friends: string[]; // Array of friend UIDs
  friendNicknames?: Record<string, string>; // Optional custom nicknames for friends
  language: 'zh-TW' | 'en' | 'ja' | 'ko';
  theme: 'light' | 'dark' | 'system';
  createdAt: number;
  updatedAt: number;
}

export type Priority = 'high' | 'medium' | 'low' | 'none';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  dueDate: number | null;  // Unix timestamp
  tags: string[];
  listId: string | null;
  sharedUserIds: string[]; // Array of UIDs for querying
  sharedWith: Record<string, 'view' | 'edit'>;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;       // Markdown
  pinned: boolean;
  tags: string[];
  sharedUserIds: string[];
  sharedWith: Record<string, 'view' | 'edit'>;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  startDate: number;    // Unix timestamp (day precision)
  endDate: number;      // Unix timestamp
  allDay: boolean;
  color: string;        // hex color
  sharedUserIds: string[];
  sharedWith: Record<string, 'view' | 'edit'>;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface InviteCode {
  id: string;
  code: string;
  creatorId: string;
  expiresAt: number;
  usedBy: string | null;
  createdAt: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserNickname: string;
  fromUserAvatar: string | null;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Conversation {
  id: string;
  participants: string[];    // [uid1, uid2, ...]
  participantNicknames: Record<string, string>;
  participantAvatars: Record<string, string | null>;
  lastMessage: string;
  lastMessageAt: number;
  createdAt: number;
  isGroup?: boolean;
  groupName?: string;
  adminId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderNickname: string;
  text: string;
  createdAt: number;
  readBy: string[];
}

export interface WebRTCSignal {
  id: string;
  conversationId: string;
  senderId: string;
  targetId: string;
  type: 'offer' | 'answer' | 'candidate' | 'file-request' | 'file-accept' | 'file-reject';
  data: any; // SDP string, ICE candidate object, or file metadata
  createdAt: number;
}

