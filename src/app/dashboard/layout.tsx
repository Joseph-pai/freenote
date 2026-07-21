import React from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { GlobalMessageListener } from '../../components/messages/GlobalMessageListener';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <GlobalMessageListener />
      {children}
    </AppShell>
  );
}
