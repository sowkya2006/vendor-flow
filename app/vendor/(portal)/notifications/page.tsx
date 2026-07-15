import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Bell, CheckCircle2, ShoppingCart, FileText, CreditCard, Building2, Package, FileSearch } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Skeleton } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { relativeTime, getNotificationMeta } from '@/lib/supabase/notification-utils'
import type { Notification } from '@/lib/supabase/notification-utils'
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/app/vendor/actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Notifications — Vendor Portal' }

const MODULE_ICON_MAP: Record<string, React.ElementType> = {
  approval:  CheckCircle2,
  vendor:    Building2,
  finance:   CreditCard,
  inventory: Package,
  system:    Bell,
}

async function NotificationList() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/vendor/login')

  // Read vendor notifications from approval_notifications table
  // filtered by recipient_id = current auth user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (supabase as any)
    .from('approval_notifications')
    .select('id, type, title, body, is_read, created_at, link, entity_type, entity_id, company_id', { count: 'exact' })
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) console.error('[VendorNotifications] fetch error:', error.message)

  const notifications = (data ?? []) as Array<Notification & { body: string }>
  const total = count ?? 0
  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[--color-foreground-muted]">
          {total} notification{total !== 1 ? 's' : ''}
          {unread > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unread} unread
            </span>
          )}
        </p>
        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">Mark all read</Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-[--color-border]">
          <Bell className="h-10 w-10 text-[--color-foreground-subtle] mb-3" />
          <p className="text-sm font-medium text-[--color-foreground]">You're all caught up!</p>
          <p className="text-xs text-[--color-foreground-muted] mt-1">No notifications yet.</p>
        </div>
      ) : (
        <ul className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm] divide-y divide-[--color-border]">
          {notifications.map((notif) => {
            const meta = getNotificationMeta(notif.type)
            const Icon = MODULE_ICON_MAP[meta.icon] ?? Bell
            const isUnread = !notif.is_read

            const colorMap: Record<string, { bg: string; icon: string; dot: string }> = {
              green:  { bg: 'bg-emerald-100',  icon: 'text-emerald-600', dot: 'bg-emerald-500' },
              red:    { bg: 'bg-red-100',       icon: 'text-red-600',    dot: 'bg-red-500'     },
              amber:  { bg: 'bg-amber-100',     icon: 'text-amber-600',  dot: 'bg-amber-500'   },
              blue:   { bg: 'bg-blue-100',      icon: 'text-blue-600',   dot: 'bg-blue-500'    },
              purple: { bg: 'bg-purple-100',    icon: 'text-purple-600', dot: 'bg-purple-500'  },
              gray:   { bg: 'bg-gray-100',      icon: 'text-gray-500',   dot: 'bg-gray-400'    },
            }
            const cols = colorMap[meta.color] ?? colorMap.gray

            const content = (
              <li className={cn(
                'relative flex items-start gap-4 px-5 py-4 hover:bg-[--color-background-subtle] transition-colors',
                isUnread && 'bg-[--color-primary]/[0.03]',
              )}>
                {isUnread && (
                  <span className={cn('absolute left-2.5 top-5 h-2 w-2 rounded-full', cols.dot)} />
                )}
                <div className={cn('mt-0.5 shrink-0 rounded-lg p-1.5', cols.bg)}>
                  <Icon className={cn('h-4 w-4', cols.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      cols.bg, cols.icon
                    )}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-[--color-foreground-subtle]">
                      {relativeTime(notif.created_at)}
                    </span>
                  </div>
                  <p className={cn(
                    'text-sm leading-snug',
                    isUnread ? 'font-semibold text-[--color-foreground]' : 'text-[--color-foreground-muted]',
                  )}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-[--color-foreground-muted] mt-0.5 leading-relaxed">
                    {notif.body}
                  </p>
                </div>
                {isUnread && (
                  <form action={markNotificationReadAction.bind(null, notif.id)}>
                    <button
                      type="submit"
                      className="shrink-0 text-[11px] text-[--color-primary] hover:underline whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  </form>
                )}
              </li>
            )

            return notif.link ? (
              <a key={notif.id} href={notif.link}>
                {content}
              </a>
            ) : (
              <div key={notif.id}>{content}</div>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function VendorNotificationsPage() {
  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Notifications</h1>
          <p className="text-xs text-[--color-foreground-muted]">Updates from the procurement team</p>
        </div>
      </div>
      <Suspense fallback={
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      }>
        <NotificationList />
      </Suspense>
    </div>
  )
}
