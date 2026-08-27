'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  Menu, Bell, Search, LogOut, User, Settings,
  Check, X, CheckCircle2, Building2, CreditCard, Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { useWorkspaceStore } from '@/store/workspace-store'
import { signOut } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'
import { getNotificationMeta, relativeTime } from '@/lib/supabase/notification-utils'
import type { Notification } from '@/lib/supabase/notification-utils'
import { markOneReadAction, markAllReadAction } from '@/app/(dashboard)/notifications/actions'
import type { PreviewEmployee } from '@/app/(dashboard)/layout'

// Icon map for notification types
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
  gray:   { bg: 'bg-gray-100 dark:bg-gray-800/50',       icon: 'text-gray-500 dark:text-gray-400',       dot: 'bg-gray-400'    },
}

export function TopNav({
  roleSwitcher,
  previewEmployee,
}: {
  roleSwitcher?: React.ReactNode
  previewEmployee?: PreviewEmployee | null
}) {
  const { setSidebarMobileOpen, sidebarMobileOpen, setCommandPaletteOpen } = useUIStore()
  const { currentUser } = useWorkspaceStore()
  const [isPending, startTransition] = useTransition()

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const supabase = createClient()
        // Use getSession() first (no network call — reads from cookie)
        // Only fall back to getUser() if we don't have a user ID from session
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
      } catch (err) {
        console.warn('[TopNav] Could not load notifications:', err instanceof Error ? err.message : 'fetch error')
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // ── Realtime subscription ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null

    channel = supabase
      .channel(`topnav-notifs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'approval_notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev.slice(0, 7)])
        },
      )
      .subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
        channel = null
      }
    }
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleSignOut() {
    // Use the server-side logout route which clears ALL cookies
    // (vf_portal, vf_ctx, vf_preview_role) before redirecting.
    // This prevents stale portal cookies from causing wrong redirects.
    window.location.href = '/api/auth/logout'
  }

  function handleMarkOne(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    startTransition(() => markOneReadAction(id))
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    startTransition(() => markAllReadAction())
  }

  function handleDismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <header
      className={cn(
        'sticky top-0 z-[40] flex h-[57px] items-center gap-3',
        'border-b px-4',
      )}
      style={{
        background: 'rgba(9,11,17,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Search trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className={cn(
          'hidden md:flex items-center gap-2.5 rounded-xl',
          'px-3 py-[7px] text-[13px] transition-all duration-150',
          'w-72',
        )}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#6B7280',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search vendors, RFQs, POs…</span>
        <kbd className="shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280' }}>
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Role Switcher */}
        {roleSwitcher}

        {/* ── Bell ── */}
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
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-[9999] mt-2 w-96 rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(17,24,39,0.95)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
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
                        disabled={isPending}
                        className="flex items-center gap-1 text-[11px] text-[--color-primary] hover:underline disabled:opacity-50"
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
                      </div>
                    ) : (
                      <ul className="divide-y divide-[--color-border]">
                        {notifications.map((n) => {
                          const meta  = getNotificationMeta(n.type)
                          const cols  = NOTIF_COLOR_MAP[meta.color] ?? NOTIF_COLOR_MAP.gray
                          const Icon  = NOTIF_ICON_MAP[meta.icon] ?? Bell
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
                            <Link key={n.id} href={n.link} onClick={() => { setNotifOpen(false); if (isNew) handleMarkOne(n.id) }}>
                              {inner}
                            </Link>
                          ) : (
                            <React.Fragment key={n.id}>{inner}</React.Fragment>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Footer — link to full page */}
                  <div className="border-t border-[--color-border] px-4 py-2.5">
                    <Link
                      href="/notifications"
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

        {/* ── User menu ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="User menu">
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={previewEmployee ? undefined : (currentUser?.avatar as string | undefined)}
                  alt={previewEmployee ? previewEmployee.full_name : (currentUser?.name ?? 'User')}
                />
                <AvatarFallback
                  className={cn(
                    'text-[10px]',
                    previewEmployee
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      : 'bg-[--color-primary]/10 text-[--color-primary]',
                  )}
                >
                  {getInitials(previewEmployee ? previewEmployee.full_name : (currentUser?.name ?? 'U'))}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {previewEmployee ? (
              <>
                <DropdownMenuLabel className="space-y-1 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                      {getInitials(previewEmployee.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[--color-foreground]">
                        {previewEmployee.full_name}
                      </p>
                      <p className="truncate text-xs text-[--color-muted-foreground]">
                        {previewEmployee.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 capitalize">
                      {previewEmployee.role.replace(/_/g, ' ')}
                    </span>
                    {previewEmployee.department && (
                      <span className="rounded-full bg-[--color-background-subtle] px-2 py-0.5 text-[10px] font-medium text-[--color-foreground-muted]">
                        {previewEmployee.department}
                      </span>
                    )}
                    {previewEmployee.designation && (
                      <span className="rounded-full bg-[--color-background-subtle] px-2 py-0.5 text-[10px] font-medium text-[--color-foreground-muted]">
                        {previewEmployee.designation}
                      </span>
                    )}
                  </div>
                  <p className="pt-1 text-[10px] text-amber-600 dark:text-amber-400">
                    👁 Preview mode — you are still logged in as admin
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-[--color-destructive] focus:text-[--color-destructive]"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out (admin)
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{currentUser?.name ?? 'Loading…'}</p>
                  <p className="text-xs text-[--color-muted-foreground]">{currentUser?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link href="/settings">
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link href="/notifications">
                    <Bell className="h-3.5 w-3.5" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto rounded-full bg-[--color-primary] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                  <Link href="/settings?tab=security">
                    <Settings className="h-3.5 w-3.5" />
                    Account settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-[--color-destructive] focus:text-[--color-destructive]"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
