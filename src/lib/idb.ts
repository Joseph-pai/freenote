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
