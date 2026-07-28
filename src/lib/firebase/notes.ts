import {
  collection, doc, addDoc, updateDoc,
  onSnapshot, query, where, orderBy,
} from 'firebase/firestore';
import { db } from './config';
import { Note, SyncQueueItem } from '../../types';
import { useNoteStore } from '../../stores/noteStore';
import { idbPutNote, idbGetNote, idbGetAllNotes, idbEnqueue } from '../idb';

export const subscribeToNotes = (userId: string) => {
  const { setNotes, setLoading } = useNoteStore.getState();
  setLoading(true);

  const ownedQ = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    where('deletedAt', '==', null)
  );

  const sharedQ = query(
    collection(db, 'notes'),
    where('sharedUserIds', 'array-contains', userId),
    where('deletedAt', '==', null)
  );

  let ownedNotes: Note[] = [];
  let sharedNotes: Note[] = [];

  const updateStore = async () => {
    // Snapshot of current store state — needed to detect local-only changes
    const { notes: currentNotes } = useNoteStore.getState();

    const map = new Map<string, Note>();
    ownedNotes.forEach(n => map.set(n.id, n));
    sharedNotes.forEach(n => map.set(n.id, n));

    // ── Fix 1: Preserve pending local notes ──────────────────────────────
    // When addDoc() fails (offline / permission denied), createNote() creates
    // a temp 'local_note_*' entry via addNote(). A subsequent onSnapshot()
    // call would wipe it via setNotes(). Keep local-only notes in the map
    // so the editor doesn't collapse after clicking "Add Note".
    currentNotes
      .filter(n => n.id.startsWith('local_note_'))
      .forEach(n => { if (!map.has(n.id)) map.set(n.id, n); });

    // ── Fix 2: Respect locally-deleted notes ─────────────────────────────
    // When updateDoc(deletedAt) fails, deleteNote() still calls removeNote()
    // so the note leaves the local store. But Firestore's snapshot still
    // returns it (deletedAt == null there). Check IDB: if the IDB record has
    // deletedAt set, the delete is pending sync — exclude the note from the
    // displayed list to prevent it from "coming back" after deletion.
    const currentIds = new Set(currentNotes.map(n => n.id));
    const restoredByFirestore = [...map.values()].filter(
      n => !n.id.startsWith('local_note_') && !currentIds.has(n.id)
    );
    for (const note of restoredByFirestore) {
      const idbNote = await idbGetNote(note.id);
      if (idbNote?.deletedAt) {
        map.delete(note.id);
      }
    }

    const all = Array.from(map.values()).sort((a, b) => {
      if (a.pinned === b.pinned) return b.updatedAt - a.updatedAt;
      return a.pinned ? -1 : 1;
    });

    setNotes(all);
    for (const note of all) await idbPutNote(note);
  };

  const unsubOwned = onSnapshot(ownedQ, (snapshot) => {
    ownedNotes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
    updateStore();
    setLoading(false);
  }, async () => {
    const cached = await idbGetAllNotes(userId);
    setNotes(cached);
    setLoading(false);
  });

  const unsubShared = onSnapshot(sharedQ, (snapshot) => {
    sharedNotes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
    updateStore();
  });

  return () => {
    unsubOwned();
    unsubShared();
  };
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
    // Merge with existing IDB record to preserve all fields
    const existing = await idbGetNote(id);
    await idbPutNote({ ...(existing ?? {}), id, ...updatedData });
    useNoteStore.getState().updateNote(id, updatedData);
  } catch {
    // Offline or SW-blocked: merge with existing IDB record before saving
    const existing = await idbGetNote(id);
    await idbPutNote({ ...(existing ?? {}), id, ...updatedData });
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
