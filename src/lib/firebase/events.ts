import {
  collection, doc, addDoc, updateDoc,
  onSnapshot, query, where, orderBy,
} from 'firebase/firestore';
import { db } from './config';
import { CalendarEvent, SyncQueueItem } from '../../types';
import { useCalendarStore } from '../../stores/calendarStore';
import { idbPutEvent, idbGetAllEvents, idbGetEvent, idbEnqueue } from '../idb';

export const subscribeToEvents = (userId: string) => {
  const { setEvents, setLoading } = useCalendarStore.getState();
  setLoading(true);

  const ownedQ = query(
    collection(db, 'events'),
    where('userId', '==', userId),
    where('deletedAt', '==', null)
  );

  const sharedQ = query(
    collection(db, 'events'),
    where('sharedUserIds', 'array-contains', userId),
    where('deletedAt', '==', null)
  );

  let ownedEvents: CalendarEvent[] = [];
  let sharedEvents: CalendarEvent[] = [];

  const updateStore = async () => {
    const { events: currentEvents } = useCalendarStore.getState();

    const map = new Map<string, CalendarEvent>();
    ownedEvents.forEach(e => map.set(e.id, e));
    sharedEvents.forEach(e => map.set(e.id, e));
    
    // ── Fix 1: Preserve pending local events ─────────────────────────────
    currentEvents
      .filter(e => e.id.startsWith('local_event_'))
      .forEach(e => { if (!map.has(e.id)) map.set(e.id, e); });

    // ── Fix 2: Respect locally-deleted events ────────────────────────────
    const currentIds = new Set(currentEvents.map(e => e.id));
    const restoredByFirestore = [...map.values()].filter(
      e => !e.id.startsWith('local_event_') && !currentIds.has(e.id)
    );
    for (const event of restoredByFirestore) {
      const idbEvent = await idbGetEvent(event.id);
      if (idbEvent?.deletedAt) {
        map.delete(event.id);
      }
    }

    const all = Array.from(map.values()).sort((a, b) => a.startDate - b.startDate);
    setEvents(all);
    for (const ev of all) {
      await idbPutEvent(ev);
    }
  };

  const unsubOwned = onSnapshot(ownedQ, (snapshot) => {
    ownedEvents = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent));
    updateStore();
    setLoading(false);
  }, async () => {
    const cached = await idbGetAllEvents(userId);
    setEvents(cached);
    setLoading(false);
  });

  const unsubShared = onSnapshot(sharedQ, (snapshot) => {
    sharedEvents = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent));
    updateStore();
  });

  return () => {
    unsubOwned();
    unsubShared();
  };
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
