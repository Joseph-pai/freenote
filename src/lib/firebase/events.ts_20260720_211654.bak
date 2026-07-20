import {
  collection, doc, addDoc, updateDoc,
  onSnapshot, query, where, orderBy,
} from 'firebase/firestore';
import { db } from './config';
import { CalendarEvent, SyncQueueItem } from '../../types';
import { useCalendarStore } from '../../stores/calendarStore';
import { idbPutEvent, idbGetAllEvents, idbEnqueue } from '../idb';

export const subscribeToEvents = (userId: string) => {
  const { setEvents, setLoading } = useCalendarStore.getState();
  setLoading(true);

  const q = query(
    collection(db, 'events'),
    where('userId', '==', userId),
    where('deletedAt', '==', null),
    orderBy('startDate', 'asc')
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const events = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent));
      setEvents(events);
      for (const ev of events) await idbPutEvent(ev);
      setLoading(false);
    },
    async () => {
      const cached = await idbGetAllEvents(userId);
      setEvents(cached);
      setLoading(false);
    }
  );

  return unsubscribe;
};

export const createEvent = async (
  userId: string,
  data: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<CalendarEvent> => {
  const now = Date.now();
  const eventData: Omit<CalendarEvent, 'id'> = {
    ...data, userId, createdAt: now, updatedAt: now, deletedAt: null,
  };
  try {
    const ref = await addDoc(collection(db, 'events'), eventData);
    const event: CalendarEvent = { id: ref.id, ...eventData };
    await idbPutEvent(event);
    useCalendarStore.getState().addEvent(event);
    return event;
  } catch {
    const tempId = `local_event_${now}`;
    const event: CalendarEvent = { id: tempId, ...eventData };
    await idbPutEvent(event);
    const queueItem: SyncQueueItem = {
      id: tempId, operation: 'create', collection: 'events',
      docId: tempId, data: eventData as Record<string, any>,
      timestamp: now, retryCount: 0,
    };
    await idbEnqueue(queueItem);
    useCalendarStore.getState().addEvent(event);
    return event;
  }
};

export const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
  const updatedData = { ...updates, updatedAt: Date.now() };
  try {
    await updateDoc(doc(db, 'events', id), updatedData);
    await idbPutEvent({ id, ...updatedData });
    useCalendarStore.getState().updateEvent(id, updatedData);
  } catch {
    await idbPutEvent({ id, ...updatedData });
    useCalendarStore.getState().updateEvent(id, updatedData);
    const queueItem: SyncQueueItem = {
      id: `upd_event_${id}_${Date.now()}`, operation: 'update',
      collection: 'events', docId: id,
      data: updatedData as Record<string, any>,
      timestamp: Date.now(), retryCount: 0,
    };
    await idbEnqueue(queueItem);
  }
};

export const deleteEvent = async (id: string) => {
  await updateEvent(id, { deletedAt: Date.now() });
  useCalendarStore.getState().removeEvent(id);
};
