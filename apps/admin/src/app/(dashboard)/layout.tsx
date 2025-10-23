'use client';

import { Providers } from '../providers';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AuthGuard>
        <DashboardLayout>{children}</DashboardLayout>
      </AuthGuard>
    </Providers>
  );
}
