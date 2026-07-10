import { AppShell } from '@/components/layout/app-shell'
import { AuthSync } from '@/components/auth/auth-sync'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      <AuthSync />
      {children}
    </AppShell>
  )
}
