'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { logout } from '../../lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n';
import { SettingsModal } from './SettingsModal';
import {
  CheckSquare, BookOpen, Calendar, MessageCircle,
  LogOut, User, MessageSquare, Settings, FileText
} from 'lucide-react';
import { subscribeToSignals } from '../../lib/firebase/signaling';
import { getWebRTCManager, saveFileToDisk, WebRTCManager } from '../../lib/webrtc/webrtc';

const navItems = [
  { href: '/dashboard/calendar', key: 'nav.calendar', icon: Calendar },
  { href: '/dashboard/tasks', key: 'nav.tasks', icon: CheckSquare },
  { href: '/dashboard/notes', key: 'nav.notes', icon: BookOpen },
  { href: '/dashboard/friends', key: 'nav.friends', icon: User },
  { href: '/dashboard/messages', key: 'nav.messages', icon: MessageSquare },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [showSettings, setShowSettings] = React.useState(false);

  // Global P2P File Transfer state
  const webrtcManagerRef = React.useRef<WebRTCManager | null>(null);
  const [incomingTransfer, setIncomingTransfer] = React.useState<{
    senderId: string;
    conversationId: string;
    fileName: string;
    fileSize: number;
    accept: () => void;
    reject: () => void;
  } | null>(null);
  const [transferProgress, setTransferProgress] = React.useState<{
    type: 'send' | 'receive';
    percent: number;
    fileName: string;
  } | null>(null);
  const [completedTransfer, setCompletedTransfer] = React.useState<{
    fileName: string;
    data: Blob;
  } | null>(null);

  const [sidebarWidth, setSidebarWidth] = React.useState(220);
  const isResizing = React.useRef(false);

  const startResizing = React.useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const stopResizing = React.useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = React.useCallback((clientX: number) => {
    if (isResizing.current) {
      const newWidth = Math.min(Math.max(clientX, 180), 400);
      setSidebarWidth(newWidth);
    }
  }, []);

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (!user) return;
    const isDark =
      user.theme === 'dark' ||
      (user.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.theme]);

  // Subscribe to WebRTC signals globally
  React.useEffect(() => {
    if (!user) return;

    const manager = getWebRTCManager(user.uid);
    manager.onIncomingFileRequest = (senderId, conversationId, fileName, fileSize, accept, reject) => {
      setIncomingTransfer({ senderId, conversationId, fileName, fileSize, accept, reject });
    };
    manager.onFileReceived = async (senderId, fileName, data) => {
      setCompletedTransfer({ fileName, data });
      setTransferProgress(null);
    };
    manager.onProgress = (type, percent, fileName) => {
      setTransferProgress({ type, percent, fileName });
      if (percent >= 100) {
        setTimeout(() => setTransferProgress(null), 2000);
      }
    };
    webrtcManagerRef.current = manager;

    const unsub = subscribeToSignals(user.uid, (signal) => {
      manager.handleSignal(signal);
    });

    return () => {
      unsub();
    };
  }, [user?.uid]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--background)' }}>

      {/* ── Desktop Sidebar ── */}
      <aside style={{
        width: `${sidebarWidth}px`, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        padding: '1.25rem 0',
        background: 'var(--surface)',
        position: 'relative'
      }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            FreeNote <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--border)', padding: '2px 6px', borderRadius: '4px' }}>v2.0</span>
          </h1>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1 }}>
          {navItems.map(({ href, key, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 1.25rem',
                fontSize: '0.9375rem', fontWeight: active ? 600 : 400,
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                borderRight: active ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.15s ease',
              }}>
                <Icon size={18} />
                {t(key)}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.875rem', fontWeight: 700, flexShrink: 0,
            }}>
              {user?.nickname?.[0]?.toUpperCase() ?? <User size={16} />}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nickname}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.875rem', color: 'var(--text-muted)', width: '100%', marginBottom: '0.5rem' }}
          >
            <Settings size={16} /> {t('nav.settings')}
          </button>
          <button
            id="logout-btn"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.875rem', color: 'var(--text-muted)', width: '100%' }}
          >
            <LogOut size={16} /> {t('nav.logout')}
          </button>
        </div>
        
        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          onTouchStart={startResizing}
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
      </aside>

      {/* ── Main content ── */}
      <main 
        style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', containerType: 'inline-size', containerName: 'main-workspace' }}
      >
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-around',
        padding: '0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom))',
      }}
        className="mobile-bottom-nav"
      >
        {navItems.map(({ href, key, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '0.375rem 0.75rem',
              color: active ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.6875rem', fontWeight: active ? 600 : 400,
            }}>
              <Icon size={22} />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* ── Global P2P File Request Modal ── */}
      {incomingTransfer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '10px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', borderRadius: '50%' }}>
                <FileText size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{lang === 'en' ? 'Incoming File Request' : '收到檔案傳送請求'}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>P2P Direct Transfer</p>
              </div>
            </div>

            <div style={{ background: 'var(--background)', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, wordBreak: 'break-all' }}>{incomingTransfer.fileName}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{(incomingTransfer.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                onClick={() => {
                  incomingTransfer.reject();
                  setIncomingTransfer(null);
                }} 
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap', minWidth: '80px' }}
              >
                {lang === 'en' ? 'Reject' : '拒絕'}
              </button>
              <button 
                onClick={() => {
                  incomingTransfer.accept();
                  setIncomingTransfer(null);
                }} 
                className="btn-primary"
                style={{ whiteSpace: 'nowrap', minWidth: '100px' }}
              >
                {lang === 'en' ? 'Accept & Download' : '同意接收'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global File Transfer Progress Toast ── */}
      {transferProgress && (
        <div style={{ position: 'fixed', bottom: '80px', right: '24px', background: 'var(--surface)', border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)', zIndex: 9999, width: '280px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem', fontWeight: 600 }}>
            <span>{transferProgress.type === 'send' ? (lang === 'en' ? 'Sending File...' : '發送檔案中...') : (lang === 'en' ? 'Receiving File...' : '接收檔案中...')}</span>
            <span>{transferProgress.percent}%</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>{transferProgress.fileName}</p>
          <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${transferProgress.percent}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {/* ── Global File Transfer Complete Modal ── */}
      {completedTransfer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '10px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: '50%' }}>
                <CheckSquare size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{lang === 'en' ? 'Transfer Complete' : '傳送完成'}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{completedTransfer.fileName}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                onClick={() => setCompletedTransfer(null)} 
                className="btn-secondary"
                style={{ whiteSpace: 'nowrap', minWidth: '80px' }}
              >
                {lang === 'en' ? 'Close' : '關閉'}
              </button>
              <button 
                onClick={async () => {
                  await saveFileToDisk(completedTransfer.fileName, completedTransfer.data);
                  setCompletedTransfer(null);
                }} 
                className="btn-primary"
                style={{ whiteSpace: 'nowrap', minWidth: '100px' }}
              >
                {lang === 'en' ? 'Save File' : '儲存檔案'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
