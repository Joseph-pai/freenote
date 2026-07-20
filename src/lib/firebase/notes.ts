import {
  collection, doc, addDoc, updateDoc,
  onSnapshot, query, where, orderBy,
} from 'firebase/firestore';
import { db } from './config';
import { Note, SyncQueueItem } from '../../types';
import { useNoteStore } from '../../stores/noteStore';
import { idbPutNote, idbGetAllNotes, idbEnqueue } from '../idb';

export const subscribeToNotes = (userId: string) => {
  const { setNotes, setLoading } = useNoteStore.getState();
  setLoading(true);

  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    where('deletedAt', '==', null),
    orderBy('pinned', 'desc'),
    orderBy('updatedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const notes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
      setNotes(notes);
      for (const note of notes) await idbPutNote(note);
      setLoading(false);
    },
    async () => {
      const cached = await idbGetAllNotes(userId);
      setNotes(cached);
      setLoading(false);
    }
  );

  return unsubscribe;
};

export const createNote = async (
  userId: string,
  data: Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>
): Promise<Note> => {
  const now = Date.now();
  const noteData: Omit<Note, 'id'> = {
    ...data, userId, createdAt: now, updatedAt: now, deletedAt: null,
  };
  try {
    const ref = await addDoc(collection(db, 'notes'), noteData);
    const note: Note = { id: ref.id, ...noteData };
    await idbPutNote(note);
    useNoteStore.getState().addNote(note);
    return note;
  } catch {
    const tempId = `local_note_${now}`;
    const note: Note = { id: tempId, ...noteData };
    await idbPutNote(note);
    const queueItem: SyncQueueItem = {
      id: tempId, operation: 'create', collection: 'notes',
      docId: tempId, data: noteData as Record<string, any>,
      timestamp: now, retryCount: 0,
    };
    await idbEnqueue(queueItem);
    useNoteStore.getState().addNote(note);
    return note;
  }
};

export const updateNote = async (id: string, updates: Partial<Note>) => {
  const updatedData = { ...updates, updatedAt: Date.now() };
  try {
    await updateDoc(doc(db, 'notes', id), updatedData);
    await idbPutNote({ id, ...updatedData });
    useNoteStore.getState().updateNote(id, updatedData);
  } catch {
    await idbPutNote({ id, ...updatedData });
    useNoteStore.getState().updateNote(id, updatedData);
    const queueItem: SyncQueueItem = {
      id: `upd_note_${id}_${Date.now()}`, operation: 'update',
      collection: 'notes', docId: id,
      data: updatedData as Record<string, any>,
      timestamp: Date.now(), retryCount: 0,
    };
    await idbEnqueue(queueItem);
  }
};

export const deleteNote = async (id: string) => {
  await updateNote(id, { deletedAt: Date.now() });
  useNoteStore.getState().removeNote(id);
};
