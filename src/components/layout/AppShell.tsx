import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <header style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>FreeNote</h1>
      </header>
      
      <div className="main-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <nav className="desktop-sidebar" style={{ width: '250px', borderRight: '1px solid var(--border)', padding: '16px', display: 'none' }}>
          {/* Sidebar links will go here */}
          <ul>
            <li>Tasks</li>
            <li>Notes</li>
            <li>Calendar</li>
          </ul>
        </nav>
        
        <main style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {children}
        </main>
      </div>

      <nav className="mobile-bottom-nav" style={{ display: 'flex', justifyContent: 'space-around', padding: '12px', borderTop: '1px solid var(--border)' }}>
        {/* Bottom nav icons will go here */}
        <span>Tasks</span>
        <span>Notes</span>
        <span>Calendar</span>
      </nav>
    </div>
  );
}
