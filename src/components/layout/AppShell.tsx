'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { logout } from '../../lib/firebase/auth';
import { useRouter } from 'next/navigation';
import {
  CheckSquare, BookOpen, Calendar, MessageCircle,
  LogOut, User,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/tasks', label: '任務', icon: CheckSquare },
  { href: '/dashboard/notes', label: '記事', icon: BookOpen },
  { href: '/dashboard/calendar', label: '日曆', icon: Calendar },
  { href: '/dashboard/messages', label: '私訊', icon: MessageCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--background)' }}>

      {/* ── Desktop Sidebar ── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '1.25rem 0',
        background: 'var(--surface)',
      }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
            FreeNote
          </h1>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1 }}>
          {navItems.map(({ href, label, icon: Icon }) => {
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
                {label}
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
            id="logout-btn"
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.875rem', color: 'var(--text-muted)', width: '100%' }}
          >
            <LogOut size={16} /> 登出
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
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
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '0.375rem 0.75rem',
              color: active ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.6875rem', fontWeight: active ? 600 : 400,
            }}>
              <Icon size={22} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
