'use client'

import React, { useState } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import {
  Menu, Sun, Moon, Bell, Search, LogOut, User, Settings,
  FileText, Building2, Package, CreditCard, AlertTriangle, Check, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { useWorkspaceStore } from '@/store/workspace-store'
import { signOut } from '@/lib/supabase/auth'
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
import { notificationsData } from '@/lib/mock-data'

const notifIconMap: Record<string, React.ElementType> = {
  FileText, Building2, Package, CreditCard, AlertTriangle,
}

const notifColorMap: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-100 dark:bg-blue-950/50',   icon: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-950/50', icon: 'text-purple-600 dark:text-purple-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-950/50', icon: 'text-orange-600 dark:text-orange-400' },
  green:  { bg: 'bg-green-100 dark:bg-green-950/50',  icon: 'text-green-600 dark:text-green-400' },
  red:    { bg: 'bg-red-100 dark:bg-red-950/50',      icon: 'text-red-600 dark:text-red-400' },
}

export function TopNav() {
  const { setSidebarMobileOpen, sidebarMobileOpen, setCommandPaletteOpen } = useUIStore()
  const { currentUser } = useWorkspaceStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState(notificationsData)

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleSignOut() {
    const { error } = await signOut()
    if (error) {
      toast.error('Could not sign out. Please try again.')
      return
    }
    router.push('/login')
    router.refresh()
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function dismissNotif(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-[40] flex h-14 items-center gap-2 border-b border-[--color-border]',
        'bg-[--color-background]/95 backdrop-blur supports-[backdrop-filter]:bg-[--color-background]/80',
        'px-4'
      )}
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
          'hidden md:flex items-center gap-2 rounded-lg border border-[--color-border]',
          'bg-[--color-background-subtle] px-3 py-1.5 text-sm text-[--color-foreground-subtle]',
          'hover:bg-[--color-accent] hover:text-[--color-foreground] transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring]'
        )}
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="w-44 text-left">Search vendors, RFQs, POs...</span>
        <kbd className="ml-auto rounded border border-[--color-border] px-1.5 py-0.5 text-[10px] font-mono text-[--color-foreground-subtle]">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[--color-primary] text-[8px] font-bold text-white">
                {unreadCount}
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
                  className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-[--color-border] bg-[--color-popover] shadow-[--shadow-lg] overflow-hidden"
                >
                  {/* Notif header */}
                  <div className="flex items-center justify-between border-b border-[--color-border] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[--color-foreground]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-[--color-primary] px-1.5 py-0.5 text-[9px] font-bold text-white">{unreadCount}</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-[--color-primary] hover:underline">
                        <Check className="h-3 w-3" />Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <Bell className="mb-2 h-6 w-6 text-[--color-foreground-subtle]" />
                        <p className="text-xs text-[--color-foreground-muted]">All caught up!</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[--color-border]">
                        {notifications.map((n) => {
                          const NIcon = notifIconMap[n.icon] ?? Bell
                          const cols = notifColorMap[n.color] ?? notifColorMap.blue
                          return (
                            <li
                              key={n.id}
                              className={cn(
                                'group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[--color-background-subtle]',
                                !n.read && 'bg-[--color-primary]/[0.03]'
                              )}
                            >
                              {!n.read && (
                                <span className="absolute left-1.5 top-4 h-1.5 w-1.5 rounded-full bg-[--color-primary]" />
                              )}
                              <div className={cn('mt-0.5 shrink-0 rounded-md p-1.5', cols.bg)}>
                                <NIcon className={cn('h-3 w-3', cols.icon)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn('text-xs leading-snug', n.read ? 'text-[--color-foreground-muted]' : 'font-medium text-[--color-foreground]')}>
                                  {n.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[--color-foreground-muted] leading-relaxed line-clamp-2">{n.description}</p>
                                <p className="mt-0.5 text-[10px] text-[--color-foreground-subtle]">{n.time}</p>
                              </div>
                              <button
                                onClick={() => dismissNotif(n.id)}
                                className="mt-0.5 shrink-0 rounded p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-[--color-border]"
                                aria-label="Dismiss"
                              >
                                <X className="h-3 w-3 text-[--color-foreground-muted]" />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="User menu">
              <Avatar className="h-7 w-7">
                <AvatarImage src={currentUser?.avatar as string | undefined} alt={currentUser?.name ?? 'User'} />
                <AvatarFallback className="text-[10px] bg-[--color-primary]/10 text-[--color-primary]">
                  {getInitials(currentUser?.name ?? 'U')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{currentUser?.name ?? 'Loading…'}</p>
              <p className="text-xs text-[--color-muted-foreground]">{currentUser?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <User className="h-3.5 w-3.5" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Settings className="h-3.5 w-3.5" />
              Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-[--color-destructive] focus:text-[--color-destructive]"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
