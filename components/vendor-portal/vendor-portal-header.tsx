'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogOut, Building2, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { VendorUser } from '@/types/vendor-portal'

export function VendorPortalHeader({ vendorUser, companyName }: {
  vendorUser: VendorUser
  companyName?: string | null
}) {
  const [isPending, setIsPending] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  // Load unread count on mount
  useEffect(() => {
    async function loadUnread() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase as any)
          .from('approval_notifications')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false)

        setUnreadCount(count ?? 0)
      } catch { /* non-critical */ }
    }
    loadUnread()
  }, [])

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null

    channel = supabase
      .channel(`vendor-notifs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'approval_notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          setUnreadCount((prev) => prev + 1)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'approval_notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Reload unread count on any update (mark read etc.)
          const s = createClient()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(s as any)
            .from('approval_notifications')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', userId)
            .eq('is_read', false)
            .then(({ count }: { count: number }) => setUnreadCount(count ?? 0))
        },
      )
      .subscribe()

    return () => {
      if (channel) { supabase.removeChannel(channel); channel = null }
    }
  }, [userId])

  async function handleSignOut() {
    setIsPending(true)
    // Use the server-side logout route which clears ALL cookies
    window.location.href = '/api/auth/logout'
  }

  const displayName = vendorUser.full_name && vendorUser.full_name !== vendorUser.email
    ? vendorUser.full_name
    : (vendorUser.vendor?.name ?? vendorUser.email ?? 'Vendor User')

  const headerCompany = companyName ?? vendorUser.vendor?.name ?? null

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-[--color-border] bg-[--color-card] shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        {headerCompany && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[--color-foreground-muted]">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[140px] font-medium text-[--color-foreground]">{headerCompany}</span>
            <span className="text-[--color-border]">·</span>
          </div>
        )}
        <span className="text-sm text-[--color-foreground-muted] truncate">{displayName}</span>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 capitalize">
          Vendor
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell with badge */}
        <Link href="/vendor/notifications" className="relative p-1.5 rounded-lg hover:bg-[--color-background-subtle] transition-colors">
          <Bell className="h-4.5 w-4.5 text-[--color-foreground-muted]" style={{ width: '1.125rem', height: '1.125rem' }} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-auto min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white leading-none shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

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
