'use client';
import React, { useState } from 'react';
import { Task, Priority } from '../../types';
import { createTask, updateTask, deleteTask } from '../../lib/firebase/tasks';
import { useAuthStore } from '../../stores/authStore';

interface TaskModalProps {
  task?: Task | null;
  onClose: () => void;
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: '🔴 高優先', color: 'var(--priority-high)' },
  { value: 'medium', label: '🟡 中優先', color: 'var(--priority-medium)' },
  { value: 'low', label: '🔵 低優先', color: 'var(--priority-low)' },
  { value: 'none', label: '⚪ 無', color: 'var(--priority-none)' },
];

export function TaskModal({ task, onClose }: TaskModalProps) {
  const { user } = useAuthStore();
  const isEdit = !!task;

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'none');
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : null,
        completed: task?.completed ?? false,
        tags: task?.tags ?? [],
        listId: task?.listId ?? null,
        sharedWith: task?.sharedWith ?? {},
      };
      if (isEdit && task) {
        await updateTask(task.id, data);
      } else {
        await createTask(user.uid, data);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('確定要刪除這個任務嗎？')) return;
    await deleteTask(task.id);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          padding: '1.5rem', width: '100%', maxWidth: '480px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h2 style={{ marginBottom: '1.25rem', fontWeight: 700, fontSize: '1.125rem' }}>
          {isEdit ? '編輯任務' : '新增任務'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="task-title">任務標題 *</label>
            <input
              id="task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="輸入任務標題..."
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="task-desc">描述（選填）</label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="補充說明..."
              rows={3}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--text-main)',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label htmlFor="task-priority">優先級</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--text-main)',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="task-due">截止日期</label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? '儲存中...' : isEdit ? '更新任務' : '新增任務'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 600,
                flex: 1,
              }}
            >
              取消
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'rgba(239,68,68,0.1)',
                  color: 'var(--priority-high)',
                  fontWeight: 600,
                }}
              >
                刪除
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
