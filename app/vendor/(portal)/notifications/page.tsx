import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Bell } from 'lucide-react'
import { getVendorUser, getVendorNotifications } from '@/lib/supabase/vendor-portal'
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/app/vendor/actions'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/shared/loading-states'
import { formatDistanceToNow } from 'date-fns'
import { VENDOR_NOTIFICATION_LABELS } from '@/types/vendor-portal'
import type { VendorNotificationType } from '@/types/vendor-portal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Notifications' }

const TYPE_STYLE: Record<VendorNotificationType, string> = {
  new_rfq: 'bg-blue-100 text-blue-700',
  quotation_accepted: 'bg-green-100 text-green-700',
  quotation_rejected: 'bg-red-100 text-red-700',
  po_issued: 'bg-orange-100 text-orange-700',
  invoice_approved: 'bg-blue-100 text-blue-700',
  payment_recorded: 'bg-emerald-100 text-emerald-700',
  approval_returned: 'bg-amber-100 text-amber-700',
  general: 'bg-gray-100 text-gray-700',
}

async function NotificationList() {
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')

  const { data, total, unread } = await getVendorNotifications(vu.vendor_id, { pageSize: 50 })

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[--color-foreground-muted]">
          {total} notification{total !== 1 ? 's' : ''}
          {unread > 0 && <span className="ml-2 rounded-full bg-[--color-primary] px-1.5 py-0.5 text-[10px] font-bold text-white">{unread} unread</span>}
        </p>
        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">Mark all read</Button>
          </form>
        )}
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-[--color-border]">
          <Bell className="h-10 w-10 text-[--color-foreground-subtle] mb-3" />
          <p className="text-sm font-medium text-[--color-foreground]">You're all caught up!</p>
          <p className="text-xs text-[--color-foreground-muted] mt-1">No notifications yet.</p>
        </div>
      ) : (
        <ul className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm] divide-y divide-[--color-border]">
          {data.map((notif) => {
            const timeAgo = (() => {
              try { return formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) }
              catch { return '' }
            })()

            return (
              <li key={notif.id} className={cn('relative flex items-start gap-4 px-5 py-4 hover:bg-[--color-background-subtle] transition-colors', !notif.read && 'bg-[--color-primary]/[0.03]')}>
                {!notif.read && <span className="absolute left-2.5 top-5 h-2 w-2 rounded-full bg-[--color-primary]" />}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_STYLE[notif.type as VendorNotificationType] ?? 'bg-gray-100 text-gray-700'}`}>
                      {VENDOR_NOTIFICATION_LABELS[notif.type as VendorNotificationType] ?? notif.type}
                    </span>
                    <span className="text-[11px] text-[--color-foreground-subtle]">{timeAgo}</span>
                  </div>
                  <p className={cn('text-sm leading-snug', !notif.read ? 'font-medium text-[--color-foreground]' : 'text-[--color-foreground-muted]')}>{notif.title}</p>
                  <p className="text-xs text-[--color-foreground-muted] mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
                {!notif.read && (
                  <form action={markNotificationReadAction.bind(null, notif.id)}>
                    <button type="submit" className="shrink-0 text-[11px] text-[--color-primary] hover:underline">Mark read</button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function VendorNotificationsPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]"><Bell className="h-5 w-5" /></div>
        <div><h1 className="text-xl font-semibold text-[--color-foreground]">Notifications</h1><p className="text-xs text-[--color-foreground-muted]">Updates from the procurement team</p></div>
      </div>
      <Suspense fallback={<div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
        <NotificationList />
      </Suspense>
    </div>
  )
}
