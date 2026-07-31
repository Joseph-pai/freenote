'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '../../../types';
import { useNoteStore } from '../../../stores/noteStore';
import { useAuthStore } from '../../../stores/authStore';
import { createNote, updateNote, deleteNote } from '../../../lib/firebase/notes';
import { NoteProvider } from '../../../components/notes/NoteProvider';
import { ShareModal } from '../../../components/shared/ShareModal';
import { Plus, Pin, PinOff, Trash2, Eye, Pencil, Search, Users, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../../lib/i18n';
import { showConfirm, showAlert } from '../../../stores/dialogStore';

// ── Auto-save hook ──────────────────────────────────────────
function useAutoSave(noteId: string | null, title: string, content: string, defaultTitle: string) {
  useEffect(() => {
    if (!noteId) return;
    const timer = setTimeout(() => {
      updateNote(noteId, { title: title || defaultTitle, content });
    }, 800);
    return () => clearTimeout(timer);
  }, [noteId, title, content, defaultTitle]);
}

// ── Note list item ──────────────────────────────────────────
function NoteListItem({
  note, active, onClick,
}: { note: Note; active: boolean; onClick: () => void }) {
  const { lang } = useTranslation();
  const preview = note.content.replace(/[#*`>\-_]/g, '').slice(0, 80);
  const date = new Date(note.updatedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-TW', {
    month: 'short', day: 'numeric',
  });
  const defaultTitle = lang === 'en' ? 'Untitled' : '無標題';
  const emptyNoteText = lang === 'en' ? 'Empty note' : '空白記事';
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        padding: '0.875rem 1rem',
        background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
        borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{
          fontWeight: 600, fontSize: '0.9375rem',
          color: active ? 'var(--primary)' : 'var(--text-main)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          flex: 1, paddingRight: '0.5rem',
        }}>
          {note.pinned && '📌 '}{note.title || defaultTitle}
        </p>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{date}</span>
      </div>
      <p style={{
        fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {preview || emptyNoteText}
      </p>
    </button>
  );
}

// ── Main notes page ─────────────────────────────────────────
export default function NotesPage() {
  const { notes, loading, activeNoteId, setActiveNoteId } = useNoteStore();
  const { user } = useAuthStore();
  const { t, lang } = useTranslation();

  const [search, setSearch] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sharingNote, setSharingNote] = useState<Note | null>(null);

  const [listWidth, setListWidth] = useState(260);
  const isResizing = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((clientX: number) => {
    if (isResizing.current && listRef.current) {
      const rect = listRef.current.getBoundingClientRect();
      const newWidth = Math.min(Math.max(clientX - rect.left, 200), 600);
      setListWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => resize(e.clientX);
    const handleTouchMove = (e: TouchEvent) => resize(e.touches[0].clientX);
    const handleMouseUp = () => stopResizing();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [resize, stopResizing]);

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  // Sync editor state when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setPreviewMode(false);
    }
  }, [activeNoteId]);

  const defaultTitle = lang === 'en' ? 'Untitled' : '無標題';

  // Auto-save
  useAutoSave(activeNoteId, title, content, defaultTitle);

  const handleNewNote = useCallback(async () => {
    if (!user) return;
    try {
      const note = await createNote(user.uid, {
        title: '', content: '', pinned: false, tags: [], sharedWith: {}, sharedUserIds: [],
      });
      setActiveNoteId(note.id);
    } catch (err: any) {
      console.error('Failed to create note:', err);
      showAlert((lang === 'en' ? 'Failed to create note: ' : '新增記事失敗: ') + err.message);
    }
  }, [user, setActiveNoteId, lang]);

  const handlePin = async () => {
    if (!activeNote) return;
    await updateNote(activeNote.id, { pinned: !activeNote.pinned });
  };

  const handleDelete = async () => {
    if (!activeNote || !await showConfirm(t('notes.deleteConfirm'))) return;
    await deleteNote(activeNote.id);
    setActiveNoteId(null);
  };

  const filtered = notes.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <NoteProvider>
      <div className={`layout-container ${activeNoteId ? 'show-detail' : 'show-list'}`} style={{
        display: 'flex', height: '100%',
        margin: '-1.5rem', overflow: 'hidden',
      }}>

        {/* ── Note List Panel ── */}
        <div className="list-panel" ref={listRef} style={{
          width: `${listWidth}px`, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{t('nav.notes')}</h2>
              <button
                id="new-note-btn"
                onClick={handleNewNote}
                style={{
                  background: 'var(--primary)', color: '#fff',
                  borderRadius: 'var(--radius-sm)', padding: '4px 10px',
                  fontSize: '0.8125rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <Plus size={14} /> {t('notes.addNote')}
              </button>
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search notes...' : '搜尋記事...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                  background: 'var(--background)', color: 'var(--text-main)',
                  fontSize: '0.875rem', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <p style={{ padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>{t('common.loading')}</p>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</p>
                <p style={{ fontSize: '0.875rem' }}>{lang === 'en' ? 'Click "Add" to create your first note' : '點擊「新增」建立您的第一篇記事'}</p>
              </div>
            ) : filtered.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                active={note.id === activeNoteId}
                onClick={() => setActiveNoteId(note.id)}
              />
            ))}
          </div>

          {/* Resizer Handle */}
          <div
            onMouseDown={startResizing}
            onTouchStart={startResizing}
            className="desktop-only"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '4px',
              height: '100%',
              cursor: 'col-resize',
              backgroundColor: 'var(--border)',
              zIndex: 10,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--border)')}
          />
        </div>

        {/* ── Editor Panel ── */}
        <div className="detail-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {!activeNote ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✏️</p>
                <p style={{ fontWeight: 600 }}>選擇一篇記事或新增記事</p>
              </div>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)',
                background: 'var(--surface)', flexWrap: 'wrap'
              }}>
                <button 
                  className="mobile-only"
                  onClick={() => setActiveNoteId(null)}
                  style={{ padding: '4px', marginRight: '4px', color: 'var(--text-muted)' }}
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  title={previewMode ? '切換編輯模式' : '切換預覽模式'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem', fontWeight: 500,
                    background: previewMode ? 'var(--primary)' : 'var(--border)',
                    color: previewMode ? '#fff' : 'var(--text-main)',
                  }}
                >
                  {previewMode ? <Pencil size={14} /> : <Eye size={14} />}
                  {previewMode ? '編輯' : '預覽'}
                </button>
                <button onClick={handlePin} title={activeNote.pinned ? '取消置頂' : '置頂'} style={{ color: activeNote.pinned ? 'var(--primary)' : 'var(--text-muted)', padding: '4px 8px' }}>
                  {activeNote.pinned ? <PinOff size={17} /> : <Pin size={17} />}
                </button>
                <button onClick={() => setSharingNote(activeNote)} title="共用記事" style={{ color: 'var(--text-muted)', padding: '4px 8px' }}>
                  <Users size={17} />
                </button>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>自動儲存中...</span>
                <button onClick={handleDelete} title="刪除記事" style={{ color: 'var(--priority-high)', padding: '4px 8px' }}>
                  <Trash2 size={17} />
                </button>
              </div>

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="記事標題..."
                style={{
                  padding: '1rem 1.5rem 0.5rem',
                  fontSize: '1.375rem', fontWeight: 700,
                  border: 'none', outline: 'none',
                  background: 'transparent', color: 'var(--text-main)',
                  fontFamily: 'inherit',
                }}
              />

              {/* Content Editor / Preview */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {previewMode ? (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.5rem 2rem' }} className="markdown-preview">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '*空白記事*'}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="使用 Markdown 格式撰寫記事...&#10;&#10;## 標題&#10;**粗體** *斜體*&#10;- 清單項目&#10;- [ ] 待辦事項"
                    style={{
                      flex: 1, padding: '0.5rem 1.5rem 2rem',
                      fontSize: '0.9375rem', lineHeight: 1.75,
                      border: 'none', outline: 'none', resize: 'none',
                      background: 'transparent', color: 'var(--text-main)',
                      fontFamily: 'ui-monospace, "Cascadia Code", monospace',
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {sharingNote && (
        <ShareModal
          itemId={sharingNote.id}
          itemType="note"
          currentSharedWith={sharingNote.sharedWith || {}}
          onSave={async (newSharedWith, newSharedUserIds) => {
            await updateNote(sharingNote.id, { sharedWith: newSharedWith, sharedUserIds: newSharedUserIds });
          }}
          onClose={() => setSharingNote(null)}
        />
      )}
    </NoteProvider>
  );
}
