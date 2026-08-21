'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useCalendarStore } from '../../../stores/calendarStore';
import { CalendarEvent } from '../../../types';
import { updateEvent } from '../../../lib/firebase/events';
import { EventModal } from '../../../components/calendar/EventModal';
import { ShareModal } from '../../../components/shared/ShareModal';
import { CalendarProvider } from '../../../components/calendar/CalendarProvider';
import { ChevronLeft, ChevronRight, Plus, Users, Pencil } from 'lucide-react';
import { useTranslation } from '../../../lib/i18n';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function toDateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  // pad to complete last week
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function CalendarPage() {
  const { user } = useAuthStore();
  const { events, currentYear, currentMonth, setCurrentMonth } = useCalendarStore();
  const { t, lang } = useTranslation();

  const WEEKDAYS = lang === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['日', '一', '二', '三', '四', '五', '六'];
  const MONTH_NAMES = lang === 'en'
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [sharingEvent, setSharingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = useMemo(() => buildCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);

  // Map events by date key
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      let d = ev.startDate;
      const end = ev.endDate;
      while (d <= end) {
        const key = toDateKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(ev);
        d += 86400000; // +1 day
      }
    }
    
    // Sort events in each day by createdAt descending (newest first)
    for (const key in map) {
      map[key].sort((a, b) => b.createdAt - a.createdAt);
    }
    
    return map;
  }, [events]);

  const selectedDayEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  const today = toDateKey(Date.now());

  const prevMonth = () => {
    if (currentMonth === 0) setCurrentMonth(currentYear - 1, 11);
    else setCurrentMonth(currentYear, currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) setCurrentMonth(currentYear + 1, 0);
    else setCurrentMonth(currentYear, currentMonth + 1);
  };

  const handleDayClick = (day: number) => {
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setSelectedDay(key);
  };

  return (
    <CalendarProvider>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={prevMonth} style={{ padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', minWidth: '120px', textAlign: 'center' }}>
            {lang === 'en' ? `${MONTH_NAMES[currentMonth]} ${currentYear}` : `${currentYear}年 ${MONTH_NAMES[currentMonth]}`}
          </h2>
          <button onClick={nextMonth} style={{ padding: '6px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date().getFullYear(), new Date().getMonth())}
            style={{ padding: '4px 12px', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            {t('calendar.today')}
          </button>
        </div>
        <button
          id="add-event-btn"
          onClick={() => { setEditingEvent(null); if (!selectedDay) setSelectedDay(today); setShowModal(true); }}
          className="btn-primary"
          style={{ width: 'auto', padding: '0.5rem 1rem', gap: '0.375rem' }}
        >
          <Plus size={18} /> {t('calendar.addEvent')}
        </button>
      </div>

      {/* ── Calendar Grid ── */}
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--border)' }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ padding: '0.625rem', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 600, color: i === 0 ? 'var(--priority-high)' : i === 6 ? 'var(--primary)' : 'var(--text-muted)' }}>
              {w}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(85px, auto)' }}>
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} style={{ borderTop: '1px solid var(--border)', borderRight: idx % 7 !== 6 ? '1px solid var(--border)' : 'none', background: 'var(--background)', opacity: 0.4 }} />;
            }
            const key = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayEvents = eventsByDay[key] ?? [];
            const isToday = key === today;
            const isSelected = key === selectedDay;
            const col = idx % 7;

            return (
              <div
                key={key}
                onClick={() => handleDayClick(day)}
                className="calendar-day-cell"
                style={{
                  padding: '4px',
                  borderTop: '1px solid var(--border)',
                  borderRight: col !== 6 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(37,99,235,0.06)' : 'transparent',
                  transition: 'background 0.15s',
                  overflow: 'hidden',
                }}
              >
                {/* Day number */}
                <div 
                  className="calendar-day-number"
                  style={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8125rem', fontWeight: isToday ? 700 : 400,
                  background: isToday ? 'var(--primary)' : 'transparent',
                  color: isToday ? '#fff' : col === 0 ? 'var(--priority-high)' : col === 6 ? 'var(--primary)' : 'var(--text-main)',
                  marginBottom: '2px',
                }}>
                  {day}
                </div>
                {/* Events */}
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setShowModal(true); }}
                    title={ev.title}
                    className="calendar-event"
                    style={{
                      background: ev.color, color: '#fff',
                      borderRadius: '3px', padding: '1px 5px',
                      fontSize: '0.6875rem', fontWeight: 500,
                      marginBottom: '2px',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', paddingLeft: '2px' }}>
                    +{dayEvents.length - 3} {t('calendar.more')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Selected day event list ── */}
      {selectedDay && selectedDayEvents.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            {selectedDay}{t('calendar.eventListTitle')}
          </h3>
          {selectedDayEvents.map((ev) => (
            <div
              key={ev.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', marginBottom: '0.5rem',
                background: 'var(--surface)',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</p>
                {ev.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.description}</p>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setShowModal(true); }} style={{ flexShrink: 0, color: 'var(--text-muted)', padding: '4px' }} aria-label="編輯事件">
                <Pencil size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setSharingEvent(ev); }} style={{ flexShrink: 0, color: 'var(--text-muted)', padding: '4px' }} aria-label="共用事件">
                <Users size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EventModal
          event={editingEvent}
          defaultDate={selectedDay ?? undefined}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
        />
      )}
      {sharingEvent && (
        <ShareModal
          itemId={sharingEvent.id}
          itemType="event"
          currentSharedWith={sharingEvent.sharedWith || {}}
          onSave={async (newSharedWith, newSharedUserIds) => {
            await updateEvent(sharingEvent.id, { sharedWith: newSharedWith, sharedUserIds: newSharedUserIds });
          }}
          onClose={() => setSharingEvent(null)}
        />
      )}
      </div>
    </CalendarProvider>
  );
}
