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

// --- Tasks ---
export const idbGetAllTasks = async (userId: string) => {
  try {
    const db = await getDB();
    const all = await db.getAllFromIndex('tasks', 'userId', userId);
    return all.filter((t) => !t.deletedAt);
  } catch (err) {
    console.warn('IDB getAllTasks failed:', err);
    return [];
  }
};

export const idbPutTask = async (task: any) => {
  try {
    const db = await getDB();
    await db.put('tasks', task);
  } catch (err) {
    console.warn('IDB putTask failed:', err);
  }
};

export const idbDeleteTask = async (id: string) => {
  try {
    const db = await getDB();
    await db.delete('tasks', id);
  } catch (err) {
    console.warn('IDB deleteTask failed:', err);
  }
};

// --- Notes ---
export const idbGetAllNotes = async (userId: string) => {
  try {
    const db = await getDB();
    const all = await db.getAllFromIndex('notes', 'userId', userId);
    return all.filter((n) => !n.deletedAt);
  } catch (err) {
    console.warn('IDB getAllNotes failed:', err);
    return [];
  }
};

export const idbGetNote = async (id: string) => {
  try {
    const db = await getDB();
    return db.get('notes', id) as Promise<any | undefined>;
  } catch (err) {
    console.warn('IDB getNote failed:', err);
    return undefined;
  }
};

export const idbPutNote = async (note: any) => {
  try {
    const db = await getDB();
    await db.put('notes', note);
  } catch (err) {
    console.warn('IDB putNote failed:', err);
  }
};

export const idbDeleteNote = async (id: string) => {
  try {
    const db = await getDB();
    await db.delete('notes', id);
  } catch (err) {
    console.warn('IDB deleteNote failed:', err);
  }
};

// --- Events ---
export const idbGetAllEvents = async (userId: string) => {
  try {
    const db = await getDB();
    const all = await db.getAllFromIndex('events', 'userId', userId);
    return all.filter((e) => !e.deletedAt);
  } catch (err) {
    console.warn('IDB getAllEvents failed:', err);
    return [];
  }
};

export const idbPutEvent = async (event: any) => {
  try {
    const db = await getDB();
    await db.put('events', event);
  } catch (err) {
    console.warn('IDB putEvent failed:', err);
  }
};

export const idbDeleteEvent = async (id: string) => {
  try {
    const db = await getDB();
    await db.delete('events', id);
  } catch (err) {
    console.warn('IDB deleteEvent failed:', err);
  }
};

// --- Sync Queue ---
export const idbEnqueue = async (item: SyncQueueItem) => {
  try {
    const db = await getDB();
    await db.put('syncQueue', item);
  } catch (err) {
    console.warn('IDB enqueue failed:', err);
  }
};

export const idbGetQueue = async (): Promise<SyncQueueItem[]> => {
  try {
    const db = await getDB();
    return db.getAll('syncQueue');
  } catch (err) {
    console.warn('IDB getQueue failed:', err);
    return [];
  }
};

export const idbDequeue = async (id: string) => {
  try {
    const db = await getDB();
    await db.delete('syncQueue', id);
  } catch (err) {
    console.warn('IDB dequeue failed:', err);
  }
};
