import { openDB, IDBPDatabase } from 'idb';
import { SyncQueueItem } from '../types';

const DB_NAME = 'freenote-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store tasks locally for offline use
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('userId', 'userId');
          taskStore.createIndex('updatedAt', 'updatedAt');
        }
        // Store notes locally
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('userId', 'userId');
          noteStore.createIndex('updatedAt', 'updatedAt');
        }
        // Store events locally
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('userId', 'userId');
          eventStore.createIndex('updatedAt', 'updatedAt');
        }
        // Queue for offline operations
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
};

// Tasks
export const idbGetAllTasks = async (userId: string) => {
  const db = await getDB();
  const all = await db.getAllFromIndex('tasks', 'userId', userId);
  return all.filter((t) => !t.deletedAt);
};

export const idbPutTask = async (task: any) => {
  const db = await getDB();
  await db.put('tasks', task);
};

export const idbDeleteTask = async (id: string) => {
  const db = await getDB();
  await db.delete('tasks', id);
};

// Notes
export const idbGetAllNotes = async (userId: string) => {
  const db = await getDB();
  const all = await db.getAllFromIndex('notes', 'userId', userId);
  return all.filter((n) => !n.deletedAt);
};

export const idbGetNote = async (id: string) => {
  const db = await getDB();
  return db.get('notes', id) as Promise<any | undefined>;
};

export const idbPutNote = async (note: any) => {
  const db = await getDB();
  await db.put('notes', note);
};

export const idbDeleteNote = async (id: string) => {
  const db = await getDB();
  await db.delete('notes', id);
};

// Events
export const idbGetAllEvents = async (userId: string) => {
  const db = await getDB();
  const all = await db.getAllFromIndex('events', 'userId', userId);
  return all.filter((e) => !e.deletedAt);
};

export const idbPutEvent = async (event: any) => {
  const db = await getDB();
  await db.put('events', event);
};

export const idbDeleteEvent = async (id: string) => {
  const db = await getDB();
  await db.delete('events', id);
};

// Sync Queue
export const idbEnqueue = async (item: SyncQueueItem) => {
  const db = await getDB();
  await db.put('syncQueue', item);
};

export const idbGetQueue = async (): Promise<SyncQueueItem[]> => {
  const db = await getDB();
  return db.getAll('syncQueue');
};

export const idbDequeue = async (id: string) => {
  const db = await getDB();
  await db.delete('syncQueue', id);
};
