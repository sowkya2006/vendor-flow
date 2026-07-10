import React from 'react'
import {
  Bell, FileText, Building2, Package, CreditCard, AlertTriangle, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDashboardNotifications } from '@/lib/supabase/dashboard'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatDistanceToNow } from 'date-fns'

const iconMap: Record<string, LucideIcon> = {
  FileText, Building2, Package, CreditCard, AlertTriangle, Bell,
}

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-100 dark:bg-blue-950/50',   icon: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-950/50', icon: 'text-purple-600 dark:text-purple-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-950/50', icon: 'text-orange-600 dark:text-orange-400' },
  green:  { bg: 'bg-green-100 dark:bg-green-950/50',  icon: 'text-green-600 dark:text-green-400' },
  red:    { bg: 'bg-red-100 dark:bg-red-950/50',      icon: 'text-red-600 dark:text-red-400' },
}

export async function NotificationsPanel() {
  let notifications: Awaited<ReturnType<typeof getDashboardNotifications>> = []
  try {
    const companyId = await getCompanyId()
    notifications = await getDashboardNotifications(companyId)
  } catch { /* not authenticated */ }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[--color-foreground-muted]" />
          <h3 className="text-sm font-semibold text-[--color-foreground]">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[--color-primary] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Bell className="h-8 w-8 text-[--color-foreground-subtle]" />
          <p className="text-sm text-[--color-foreground-muted]">You're all caught up!</p>
        </div>
      ) : (
        <ul className="divide-y divide-[--color-border]" role="list">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.icon] ?? Bell
            const colors = colorMap[notif.color] ?? colorMap.blue
            const timeAgo = (() => {
              try { return formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) }
              catch { return '—' }
            })()

            return (
              <li
                key={notif.id}
                className={cn(
                  'relative flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[--color-background-subtle]',
                  !notif.read && 'bg-[--color-primary]/[0.03]',
                )}
              >
                {!notif.read && (
                  <span className="absolute left-2 top-5 h-1.5 w-1.5 rounded-full bg-[--color-primary]" />
                )}
                <div className={cn('mt-0.5 shrink-0 rounded-lg p-1.5', colors.bg)}>
                  <Icon className={cn('h-3.5 w-3.5', colors.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm leading-snug',
                    notif.read ? 'text-[--color-foreground-muted]' : 'font-medium text-[--color-foreground]',
                  )}>
                    {notif.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[--color-foreground-muted] leading-relaxed">
                    {notif.description}
                  </p>
                  <p className="mt-1 text-[11px] text-[--color-foreground-subtle]">{timeAgo}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
