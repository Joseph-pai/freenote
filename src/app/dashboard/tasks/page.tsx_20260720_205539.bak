'use client';
import React, { useState } from 'react';
import { Task } from '../../../types';
import { useTaskStore } from '../../../stores/taskStore';
import { updateTask } from '../../../lib/firebase/tasks';
import { TaskProvider } from '../../../components/tasks/TaskProvider';
import { TaskModal } from '../../../components/tasks/TaskModal';
import { ShareModal } from '../../../components/shared/ShareModal';
import { Plus, CheckCircle2, Circle, Calendar, Flag, Pencil, Users } from 'lucide-react';

const priorityColor: Record<string, string> = {
  high: 'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low: 'var(--priority-low)',
  none: 'var(--priority-none)',
};

const priorityLabel: Record<string, string> = {
  high: '高', medium: '中', low: '低', none: '—',
};

function TaskItem({ task, onEdit, onShare }: { task: Task; onEdit: (t: Task) => void; onShare: (t: Task) => void }) {
  const toggleComplete = () => updateTask(task.id, { completed: !task.completed });
  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
    : null;
  const isOverdue = task.dueDate && !task.completed && task.dueDate < Date.now();

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      padding: '0.875rem 1rem',
      background: 'var(--surface)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
      transition: 'box-shadow 0.15s ease',
      marginBottom: '0.5rem',
    }}>
      <button
        onClick={toggleComplete}
        style={{ flexShrink: 0, color: task.completed ? 'var(--primary)' : 'var(--text-muted)', marginTop: '2px' }}
        aria-label={task.completed ? '標記未完成' : '標記完成'}
      >
        {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 500,
          textDecoration: task.completed ? 'line-through' : 'none',
          color: task.completed ? 'var(--text-muted)' : 'var(--text-main)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.title}
        </p>
        {task.description && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.description}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem', alignItems: 'center' }}>
          {task.priority !== 'none' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px',
              fontSize: '0.75rem', color: priorityColor[task.priority] }}>
              <Flag size={12} /> {priorityLabel[task.priority]}
            </span>
          )}
          {dueLabel && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px',
              fontSize: '0.75rem', color: isOverdue ? 'var(--priority-high)' : 'var(--text-muted)' }}>
              <Calendar size={12} /> {dueLabel}{isOverdue ? ' 已逾期' : ''}
            </span>
          )}
        </div>
      </div>

      <button onClick={() => onEdit(task)} style={{ flexShrink: 0, color: 'var(--text-muted)', padding: '4px' }} aria-label="編輯任務">
        <Pencil size={16} />
      </button>
      <button onClick={() => onShare(task)} style={{ flexShrink: 0, color: 'var(--text-muted)', padding: '4px' }} aria-label="共用任務">
        <Users size={16} />
      </button>
    </div>
  );
}

export default function TasksPage() {
  const { tasks, loading } = useTaskStore();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <TaskProvider>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem' }}>任務清單</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {activeCount > 0 ? `${activeCount} 個待完成` : '所有任務已完成 🎉'}
            </p>
          </div>
          <button
            id="add-task-btn"
            onClick={() => { setEditingTask(null); setShowModal(true); }}
            className="btn-primary"
            style={{ width: 'auto', padding: '0.625rem 1rem', gap: '0.375rem' }}
          >
            <Plus size={18} /> 新增
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(['all', 'active', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '99px',
                fontSize: '0.875rem',
                fontWeight: 500,
                border: '1px solid var(--border)',
                background: filter === f ? 'var(--primary)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {f === 'all' ? '全部' : f === 'active' ? '待完成' : '已完成'}
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>載入中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</p>
            <p style={{ fontWeight: 500 }}>沒有任務</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>點擊右上角新增您的第一個任務！</p>
          </div>
        ) : (
          <div>
            {filtered.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={(t) => { setEditingTask(t); setShowModal(true); }}
                onShare={(t) => setSharingTask(t)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
        />
      )}
      {sharingTask && (
        <ShareModal
          itemId={sharingTask.id}
          itemType="task"
          currentSharedWith={sharingTask.sharedWith || {}}
          onSave={async (newSharedWith, newSharedUserIds) => {
            await updateTask(sharingTask.id, { sharedWith: newSharedWith, sharedUserIds: newSharedUserIds });
          }}
          onClose={() => setSharingTask(null)}
        />
      )}
    </TaskProvider>
  );
}
