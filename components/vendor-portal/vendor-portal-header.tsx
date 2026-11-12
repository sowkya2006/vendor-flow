'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  LogOut, Building2, Bell, Check, X,
  CheckCircle2, ShoppingCart, FileText, CreditCard, Package, Settings,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { VendorUser } from '@/types/vendor-portal'
import { getNotificationMeta, relativeTime } from '@/lib/supabase/notification-utils'
import type { Notification } from '@/lib/supabase/notification-utils'
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/app/vendor/actions'

// Icon map matching company portal
const NOTIF_ICON_MAP = {
  approval:  CheckCircle2,
  vendor:    Building2,
  finance:   CreditCard,
  inventory: Package,
  system:    Settings,
} as const

const NOTIF_COLOR_MAP: Record<string, { bg: string; icon: string; dot: string }> = {
  green:  { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  red:    { bg: 'bg-red-100 dark:bg-red-900/30',         icon: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500'     },
  amber:  { bg: 'bg-amber-100 dark:bg-amber-900/30',     icon: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500'   },
  blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',       icon: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500'    },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30',   icon: 'text-purple-600 dark:text-purple-400',   dot: 'bg-purple-500'  },
  cyan:   { bg: 'bg-cyan-100 dark:bg-cyan-900/30',       icon: 'text-cyan-600 dark:text-cyan-400',       dot: 'bg-cyan-500'    },
  gray:   { bg: 'bg-gray-100 dark:bg-gray-800/50',       icon: 'text-gray-500 dark:text-gray-400',       dot: 'bg-gray-400'    },
}

export function VendorPortalHeader({ vendorUser, companyName }: {
  vendorUser: VendorUser
  companyName?: string | null
}) {
  const [isPending, setIsPending] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // ── Load notifications on mount ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user || !mounted) return
        const uid = session.user.id
        setUserId(uid)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('approval_notifications')
          .select('id, request_id, company_id, recipient_id, type, title, body, is_read, read_at, sent_at, created_at, link, entity_type, entity_id')
          .eq('recipient_id', uid)
          .order('created_at', { ascending: false })
          .limit(8)
        if (mounted) setNotifications((data ?? []) as Notification[])
      } catch { /* non-critical */ }
    }
    load()
    return () => { mounted = false }
  }, [])

  // ── Realtime subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null
    channel = supabase
      .channel(`vendor-header-notifs-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'approval_notifications',
        filter: `recipient_id=eq.${userId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev.slice(0, 7)])
      })
      .subscribe()
    return () => { if (channel) { supabase.removeChannel(channel); channel = null } }
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  function handleMarkOne(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    startTransition(() => markNotificationReadAction(id))
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    startTransition(() => markAllNotificationsReadAction())
  }

  function handleDismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  async function handleSignOut() {
    setIsPending(true)
    window.location.href = '/api/auth/logout'
  }

  const displayName = vendorUser.full_name && vendorUser.full_name !== vendorUser.email
    ? vendorUser.full_name
    : (vendorUser.vendor?.name ?? vendorUser.email ?? 'Vendor User')

  const headerCompany = companyName ?? vendorUser.vendor?.name ?? null

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-[--color-border] bg-[--color-card] shrink-0">
      {/* Left — company + user info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {headerCompany && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[--color-foreground-muted]">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[140px] font-medium text-[--color-foreground]">{headerCompany}</span>
            <span className="text-[--color-border]">·</span>
          </div>
        )}
        <span className="text-sm text-[--color-foreground-muted] truncate">{displayName}</span>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Vendor
        </span>
      </div>

      {/* Right — bell + sign out */}
      <div className="flex items-center gap-2">

        {/* ── Notification Bell with Dropdown ───────────────────────────── */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Notifications"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-auto min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          <AnimatePresence>
            {notifOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-[9999] mt-2 w-96 rounded-2xl overflow-hidden"
                  style={{
                    background: 'var(--color-popover)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-[--color-border] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[--color-foreground]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-[--color-primary] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[11px] text-[--color-primary] hover:underline"
                      >
                        <Check className="h-3 w-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <Bell className="mb-2 h-6 w-6 text-[--color-foreground-subtle]" />
                        <p className="text-xs text-[--color-foreground-muted]">All caught up!</p>
                        <p className="text-[11px] text-[--color-foreground-subtle] mt-0.5">
                          Notifications for RFQs, POs and payments appear here
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[--color-border]">
                        {notifications.map((n) => {
                          const meta = getNotificationMeta(n.type)
                          const cols = NOTIF_COLOR_MAP[meta.color] ?? NOTIF_COLOR_MAP.gray
                          const Icon = NOTIF_ICON_MAP[meta.icon as keyof typeof NOTIF_ICON_MAP] ?? Bell
                          const isNew = !n.is_read

                          const inner = (
                            <li
                              key={n.id}
                              className={cn(
                                'group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[--color-background-subtle]',
                                isNew && 'bg-[--color-primary]/[0.03]',
                              )}
                            >
                              {isNew && (
                                <span className={cn('absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full', cols.dot)} />
                              )}
                              <div className={cn('mt-0.5 shrink-0 rounded-md p-1.5', cols.bg)}>
                                <Icon className={cn('h-3.5 w-3.5', cols.icon)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  'text-xs leading-snug',
                                  isNew ? 'font-semibold text-[--color-foreground]' : 'text-[--color-foreground-muted]',
                                )}>
                                  {n.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[--color-foreground-muted] leading-relaxed line-clamp-2">
                                  {n.body}
                                </p>
                                <p className="mt-0.5 text-[10px] text-[--color-foreground-subtle]">
                                  {relativeTime(n.created_at)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                {isNew && (
                                  <button
                                    title="Mark read"
                                    onClick={(e) => { e.preventDefault(); handleMarkOne(n.id) }}
                                    className="rounded p-0.5 hover:bg-[--color-border]"
                                  >
                                    <CheckCircle2 className="h-3 w-3 text-[--color-foreground-muted]" />
                                  </button>
                                )}
                                <button
                                  title="Dismiss"
                                  onClick={(e) => { e.preventDefault(); handleDismiss(n.id) }}
                                  className="rounded p-0.5 hover:bg-[--color-border]"
                                >
                                  <X className="h-3 w-3 text-[--color-foreground-muted]" />
                                </button>
                              </div>
                            </li>
                          )

                          return n.link ? (
                            <Link
                              key={n.id}
                              href={n.link}
                              onClick={() => { setNotifOpen(false); if (isNew) handleMarkOne(n.id) }}
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div key={n.id}>{inner}</div>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-[--color-border] px-4 py-2.5">
                    <Link
                      href="/vendor/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="block text-center text-xs font-medium text-[--color-primary] hover:underline"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={handleSignOut}
          className="gap-1.5 shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" />
          {isPending ? 'Signing out…' : 'Sign Out'}
        </Button>
      </div>
    </header>
  )
}
