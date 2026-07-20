import { create } from 'zustand';
import { Note } from '../types';

interface NoteState {
  notes: Note[];
  loading: boolean;
  activeNoteId: string | null;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setActiveNoteId: (id: string | null) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  loading: false,
  activeNoteId: null,
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  removeNote: (id) =>
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setActiveNoteId: (id) => set({ activeNoteId: id }),
}));
