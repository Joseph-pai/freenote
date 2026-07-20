export interface AppUser {
  uid: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
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
  sharedWith: Record<string, 'view' | 'edit'>;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}
