import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Bell } from 'lucide-react'
import { getNotifications } from '@/lib/supabase/notifications'
import { getUserRole } from '@/lib/supabase/get-auth'
import type { NotificationFilter } from '@/lib/supabase/notifications'
import { NotificationsClient } from '@/components/notifications/notifications-client'
import { Skeleton } from '@/components/shared/loading-states'

export const metadata: Metadata = { title: 'Notifications — VendorFlow' }

interface Props {
  searchParams: Promise<{ filter?: string; page?: string }>
}

async function NotificationsContent({ filter, page, role }: { filter: NotificationFilter; page: number; role: string }) {
  const result = await getNotifications(filter, page, 30)
  return (
    <NotificationsClient
      initialData={result.data}
      total={result.total}
      unreadCount={result.unreadCount}
      currentFilter={filter}
      currentPage={page}
      role={role}
    />
  )
}

export default async function NotificationsPage({ searchParams }: Props) {
  const params = await searchParams
  const filter = (['all', 'unread', 'approvals', 'system'].includes(params.filter ?? '')
    ? params.filter
    : 'all') as NotificationFilter
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const role = await getUserRole()

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[--color-primary]/10 to-indigo-500/10 border border-[--color-primary]/15 text-[--color-primary]">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[--color-foreground]">Notifications</h1>
          <p className="text-xs text-[--color-foreground-muted]">
            Stay on top of approvals, vendor updates, and system alerts
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        }
      >
        <NotificationsContent filter={filter} page={page} role={role} />
      </Suspense>
    </div>
  )
}
