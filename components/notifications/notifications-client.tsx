'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, CheckCheck, Trash2, X, CheckCircle2,
  XCircle, RotateCcw, Building2, Package, CreditCard,
  ShoppingCart, AlertTriangle, Users, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  markOneReadAction,
  markAllReadAction,
  deleteNotificationAction,
  deleteAllReadAction,
} from '@/app/(dashboard)/notifications/actions'
import { getNotificationMeta, relativeTime } from '@/lib/supabase/notification-utils'
import type { Notification } from '@/lib/supabase/notification-utils'
import type { NotificationFilter } from '@/lib/supabase/notification-utils'

// ── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP = {
  approval:  CheckCircle2,
  vendor:    Building2,
  finance:   CreditCard,
  inventory: Package,
  system:    Settings,
} as const

const COLOR_MAP: Record<string, { dot: string; bg: string; text: string }> = {
  green:  { dot: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  red:    { dot: 'bg-red-500',     bg: 'bg-red-100 dark:bg-red-900/30',         text: 'text-red-600 dark:text-red-400'         },
  amber:  { dot: 'bg-amber-500',   bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-600 dark:text-amber-400'     },
  blue:   { dot: 'bg-blue-500',    bg: 'bg-blue-100 dark:bg-blue-900/30',       text: 'text-blue-600 dark:text-blue-400'       },
  purple: { dot: 'bg-purple-500',  bg: 'bg-purple-100 dark:bg-purple-900/30',   text: 'text-purple-600 dark:text-purple-400'   },
  gray:   { dot: 'bg-gray-400',    bg: 'bg-gray-100 dark:bg-gray-800/50',       text: 'text-gray-500 dark:text-gray-400'       },
}

// Role-based visible filter tabs
// Administrator sees all tabs.
// Other roles see only tabs relevant to their work.
const ROLE_FILTER_TABS: Record<string, { key: NotificationFilter; label: string }[]> = {
  administrator:       [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'system', label: 'System' },
  ],
  admin:               [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'system', label: 'System' },
  ],
  procurement_manager: [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'approvals', label: 'Approvals' },
  ],
  procurement_officer: [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
  ],
  finance_manager:     [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'system', label: 'Finance Alerts' },
  ],
  warehouse_manager:   [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'system', label: 'Inventory Alerts' },
  ],
}

const DEFAULT_FILTER_TABS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
]

// ── Props ────────────────────────────────────────────────────────────────────
interface Props {
  initialData:    Notification[]
  total:          number
  unreadCount:    number
  currentFilter:  NotificationFilter
  currentPage:    number
  role?:          string
}

// ── Component ─────────────────────────────────────────────────────────────────
export function NotificationsClient({
  initialData,
  total,
  unreadCount: initialUnreadCount,
  currentFilter,
  currentPage,
  role = 'viewer',
}: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Local state — optimistic updates on top of server data
  const [items, setItems]       = useState<Notification[]>(initialData)
  const [unread, setUnread]     = useState(initialUnreadCount)

  // Sync when server re-renders (navigation, revalidation)
  useEffect(() => {
    setItems(initialData)
    setUnread(initialUnreadCount)
  }, [initialData, initialUnreadCount])

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    // Use a ref-style variable so cleanup can always remove the channel,
    // even when subscribe() is called asynchronously.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null
    let cancelled = false

    supabase.auth.getUser().then(({ data: { user } }) => {
      // Effect was cleaned up before getUser resolved — don't subscribe
      if (cancelled || !user) return

      channel = supabase
        .channel(`notifications-page-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'approval_notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification
            const meta = getNotificationMeta(newNotif.type)
            const matchesFilter =
              currentFilter === 'all' ||
              (currentFilter === 'unread' && !newNotif.is_read) ||
              (currentFilter === 'approvals' && meta.icon === 'approval') ||
              (currentFilter === 'system'    && meta.icon !== 'approval')

            if (matchesFilter) {
              setItems((prev) => [newNotif, ...prev.slice(0, 29)])
            }
            setUnread((n) => n + 1)
          },
        )
        .subscribe()
    })

    // Cleanup: called by React before the next effect run (StrictMode or deps change)
    return () => {
      cancelled = true
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    }
  }, [currentFilter])

  // ── Helpers ────────────────────────────────────────────────────────────────
  function buildHref(filter: NotificationFilter) {
    return `${pathname}?filter=${filter}`
  }

  function optimisticMarkRead(id: string) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    setUnread((c) => Math.max(0, c - 1))
  }

  function optimisticDelete(id: string) {
    const notif = items.find((n) => n.id === id)
    setItems((prev) => prev.filter((n) => n.id !== id))
    if (notif && !notif.is_read) setUnread((c) => Math.max(0, c - 1))
  }

  function optimisticMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnread(0)
  }

  function optimisticDeleteAllRead() {
    setItems((prev) => prev.filter((n) => !n.is_read))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const pageSize = 30
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const filterTabs = ROLE_FILTER_TABS[role] ?? DEFAULT_FILTER_TABS

  return (
    <div className="space-y-4">
      {/* Filter tabs + actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-[--color-border] bg-[--color-background-subtle] p-1">
          {filterTabs.map((tab) => (
            <Link
              key={tab.key}
              href={buildHref(tab.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
                currentFilter === tab.key
                  ? 'bg-white/[0.08] text-[#F5F5F5] shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
                  : 'text-[#AEB4C2] hover:text-[#F5F5F5]',
              )}
            >
              {tab.label}
              {tab.key === 'unread' && unread > 0 && (
                <span className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  currentFilter === 'unread'
                    ? 'bg-[--color-primary]/10 text-[--color-primary]'
                    : 'bg-[--color-primary]/10 text-[--color-primary]',
                )}>
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="gap-1.5 text-xs"
              onClick={() => {
                optimisticMarkAllRead()
                startTransition(() => markAllReadAction())
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
          {items.some((n) => n.is_read) && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="gap-1.5 text-xs text-[--color-foreground-muted]"
              onClick={() => {
                optimisticDeleteAllRead()
                startTransition(() => deleteAllReadAction())
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear read
            </Button>
          )}
        </div>
      </div>

      {/* Notification list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[--color-border] bg-[--color-background-subtle] py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[--color-background-muted] mb-3">
            <Bell className="h-7 w-7 text-[--color-foreground-subtle]" />
          </div>
          <p className="text-[15px] font-semibold text-[--color-foreground]">All caught up!</p>
          <p className="text-sm text-[--color-foreground-muted] mt-1">
            {currentFilter === 'unread' ? 'No unread notifications.' : 'No notifications to show.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d1117] divide-y divide-white/[0.05] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          {items.map((notif) => {
            const meta   = getNotificationMeta(notif.type)
            const cols   = COLOR_MAP[meta.color] ?? COLOR_MAP.gray
            const Icon   = ICON_MAP[meta.icon] ?? Bell
            const isNew  = !notif.is_read

            const inner = (
              <div
                className={cn(
                  'group relative flex items-start gap-4 px-5 py-4 transition-colors',
                  'hover:bg-[--color-background-subtle]',
                  isNew && 'bg-[--color-primary]/[0.025]',
                )}
              >
                {/* Unread dot */}
                {isNew && (
                  <span className={cn(
                    'absolute left-2 top-5 h-2 w-2 rounded-full',
                    cols.dot,
                  )} />
                )}

                {/* Icon badge */}
                <div className={cn(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  cols.bg,
                )}>
                  <Icon className={cn('h-4 w-4', cols.text)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      'text-sm leading-snug',
                      isNew ? 'font-semibold text-[--color-foreground]' : 'text-[--color-foreground-muted]',
                    )}>
                      {notif.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-[--color-foreground-subtle] whitespace-nowrap">
                      {relativeTime(notif.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[--color-foreground-muted] leading-relaxed line-clamp-2">
                    {notif.body}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      cols.bg, cols.text,
                      'border-transparent',
                    )}>
                      {meta.label}
                    </span>
                  </div>
                </div>

                {/* Row actions — visible on hover */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {isNew && (
                    <button
                      aria-label="Mark as read"
                      title="Mark as read"
                      onClick={(e) => {
                        e.preventDefault()
                        optimisticMarkRead(notif.id)
                        startTransition(() => markOneReadAction(notif.id))
                      }}
                      className="rounded p-1 text-[--color-foreground-subtle] hover:bg-[--color-border] hover:text-[--color-foreground]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    aria-label="Dismiss"
                    title="Dismiss"
                    onClick={(e) => {
                      e.preventDefault()
                      optimisticDelete(notif.id)
                      startTransition(() => deleteNotificationAction(notif.id))
                    }}
                    className="rounded p-1 text-[--color-foreground-subtle] hover:bg-[--color-border] hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )

            return notif.link ? (
              <Link key={notif.id} href={notif.link} className="block">
                {inner}
              </Link>
            ) : (
              <div key={notif.id}>{inner}</div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[--color-foreground-muted]">
            Page {currentPage} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-1 text-xs"
              >
                <Link href={`${pathname}?filter=${currentFilter}&page=${currentPage - 1}`}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Link>
              </Button>
            )}
            {currentPage < totalPages && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-1 text-xs"
              >
                <Link href={`${pathname}?filter=${currentFilter}&page=${currentPage + 1}`}>
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
