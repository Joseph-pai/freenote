import { create } from 'zustand';
import { CalendarEvent } from '../types';

interface CalendarState {
  events: CalendarEvent[];
  loading: boolean;
  currentYear: number;
  currentMonth: number; // 0-indexed
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  removeEvent: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setCurrentMonth: (year: number, month: number) => void;
}

const now = new Date();

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  loading: false,
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth(),
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((s) => ({ events: [event, ...s.events] })),
  updateEvent: (id, updates) =>
    set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),
  removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
  setLoading: (loading) => set({ loading }),
  setCurrentMonth: (year, month) => set({ currentYear: year, currentMonth: month }),
}));
