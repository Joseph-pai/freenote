import React from 'react';
import './globals.css';
import AuthProvider from '../components/auth/AuthProvider';

export const metadata = {
  title: 'FreeNote',
  description: 'Your all-in-one productivity app.',
  manifest: '/manifest.json',
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
