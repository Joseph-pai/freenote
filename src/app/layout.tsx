import React from 'react';
import './globals.css';
import './responsive.css';
import AuthProvider from '../components/auth/AuthProvider';

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'FreeNote',
  description: 'Your all-in-one productivity app.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FreeNote',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
