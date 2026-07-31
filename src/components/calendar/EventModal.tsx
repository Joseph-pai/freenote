'use client';
import React, { useState } from 'react';
import { CalendarEvent } from '../../types';
import { createEvent, updateEvent, deleteEvent } from '../../lib/firebase/events';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from '../../lib/i18n';
import { showConfirm } from '../../stores/dialogStore';

interface EventModalProps {
  event?: CalendarEvent | null;
  defaultDate?: string; // YYYY-MM-DD
  onClose: () => void;
}

const COLOR_OPTIONS = [
  '#2563eb', '#7c3aed', '#db2777', '#ef4444',
  '#f59e0b', '#10b981', '#0ea5e9', '#64748b',
];

export function EventModal({ event, defaultDate, onClose }: EventModalProps) {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isEdit = !!event;

  const todayStr = defaultDate || new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startDate, setStartDate] = useState(
    event ? new Date(event.startDate).toISOString().split('T')[0] : todayStr
  );
  const [endDate, setEndDate] = useState(
    event ? new Date(event.endDate).toISOString().split('T')[0] : todayStr
  );
  const [color, setColor] = useState(event?.color ?? '#2563eb');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
        allDay: true,
        color,
        sharedUserIds: event?.sharedUserIds ?? [],
        sharedWith: event?.sharedWith ?? {},
      };
      if (isEdit && event) {
        await updateEvent(event.id, data);
      } else {
        await createEvent(user.uid, data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !await showConfirm(t('event.deleteConfirm'))) return;
    await deleteEvent(event.id);
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ marginBottom: '1.25rem', fontWeight: 700, fontSize: '1.125rem' }}>
          {isEdit ? t('calendar.editEvent') : t('calendar.addEvent')}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="event-title">{t('event.title')}</label>
            <input id="event-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('event.titlePlaceholder')} autoFocus />
          </div>
          <div className="input-group">
            <label htmlFor="event-desc">{t('event.desc')}</label>
            <input id="event-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('event.descPlaceholder')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label htmlFor="event-start">{t('event.start')}</label>
              <input id="event-start" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }} />
            </div>
            <div className="input-group">
              <label htmlFor="event-end">{t('event.end')}</label>
              <input id="event-end" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Color picker */}
          <div className="input-group">
            <label>{t('event.color')}</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                   key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: color === c ? '3px solid var(--text-main)' : '3px solid transparent',
                    outline: color === c ? '2px solid var(--background)' : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? t('event.saving') : isEdit ? t('event.update') : t('event.add')}
            </button>
            <button type="button" onClick={onClose} style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, flex: 1 }}>
              {t('common.cancel')}
            </button>
            {isEdit && (
              <button type="button" onClick={handleDelete} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--priority-high)', fontWeight: 600 }}>
                {t('common.delete')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
