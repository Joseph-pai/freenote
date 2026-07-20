import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  enableIndexedDbPersistence,
  Firestore,
} from 'firebase/firestore';
import { db } from './config';
import { Task, SyncQueueItem } from '../../types';
import { useTaskStore } from '../../stores/taskStore';
import {
  idbPutTask,
  idbGetAllTasks,
  idbEnqueue,
  idbGetQueue,
  idbDequeue,
} from '../idb';

// Enable offline persistence (call once on app start)
export const enableOfflinePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db as Firestore);
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open – offline persistence limited.');
    } else if (err.code === 'unimplemented') {
      console.warn('Offline persistence not supported in this browser.');
    }
  }
};

// Subscribe to user's tasks in realtime
export const subscribeToTasks = (userId: string) => {
  const { setTasks, setLoading } = useTaskStore.getState();
  setLoading(true);

  const ownedQ = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    where('deletedAt', '==', null)
  );

  const sharedQ = query(
    collection(db, 'tasks'),
    where('sharedUserIds', 'array-contains', userId),
    where('deletedAt', '==', null)
  );

  let ownedTasks: Task[] = [];
  let sharedTasks: Task[] = [];

  const updateStore = async () => {
    // Deduplicate just in case
    const map = new Map<string, Task>();
    ownedTasks.forEach(t => map.set(t.id, t));
    sharedTasks.forEach(t => map.set(t.id, t));
    
    const all = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
    setTasks(all);
    for (const task of all) {
      await idbPutTask(task);
    }
  };

  const unsubOwned = onSnapshot(ownedQ, (snapshot) => {
    ownedTasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
    updateStore();
    setLoading(false);
  }, async () => {
    const cached = await idbGetAllTasks(userId);
    setTasks(cached);
    setLoading(false);
  });

  const unsubShared = onSnapshot(sharedQ, (snapshot) => {
    sharedTasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
    updateStore();
  });

  return () => {
    unsubOwned();
    unsubShared();
  };
};

// Create a task (handles offline gracefully)
export const createTask = async (
  userId: string,
  data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<Task> => {
  const now = Date.now();
  const taskData: Omit<Task, 'id'> = {
    ...data,
    userId,
    sharedUserIds: data.sharedUserIds ?? [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  try {
    const ref = await addDoc(collection(db, 'tasks'), taskData);
    const task: Task = { id: ref.id, ...taskData };
    await idbPutTask(task);
    useTaskStore.getState().addTask(task);
    return task;
  } catch {
    // Offline – save locally and queue sync
    const tempId = `local_${now}_${Math.random().toString(36).slice(2)}`;
    const task: Task = { id: tempId, ...taskData };
    await idbPutTask(task);
    const queueItem: SyncQueueItem = {
      id: tempId,
      operation: 'create',
      collection: 'tasks',
      docId: tempId,
      data: taskData as Record<string, any>,
      timestamp: now,
      retryCount: 0,
    };
    await idbEnqueue(queueItem);
    useTaskStore.getState().addTask(task);
    return task;
  }
};

// Update a task
export const updateTask = async (id: string, updates: Partial<Task>) => {
  const updatedData = { ...updates, updatedAt: Date.now() };
  try {
    await updateDoc(doc(db, 'tasks', id), updatedData);
    await idbPutTask({ id, ...updatedData });
    useTaskStore.getState().updateTask(id, updatedData);
  } catch {
    // Offline queue
    await idbPutTask({ id, ...updatedData });
    useTaskStore.getState().updateTask(id, updatedData);
    const queueItem: SyncQueueItem = {
      id: `upd_${id}_${Date.now()}`,
      operation: 'update',
      collection: 'tasks',
      docId: id,
      data: updatedData as Record<string, any>,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await idbEnqueue(queueItem);
  }
};

// Soft-delete a task
export const deleteTask = async (id: string) => {
  await updateTask(id, { deletedAt: Date.now() });
  useTaskStore.getState().removeTask(id);
};

// Process offline sync queue when back online
export const flushSyncQueue = async () => {
  const queue = await idbGetQueue();
  for (const item of queue) {
    try {
      if (item.operation === 'create') {
        await addDoc(collection(db, item.collection), item.data);
      } else if (item.operation === 'update') {
        await updateDoc(doc(db, item.collection, item.docId), item.data);
      } else if (item.operation === 'delete') {
        await deleteDoc(doc(db, item.collection, item.docId));
      }
      await idbDequeue(item.id);
    } catch (err) {
      console.warn('Sync queue flush failed for item:', item.id, err);
    }
  }
};
