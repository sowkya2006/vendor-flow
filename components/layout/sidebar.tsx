'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, Package, FileText, FileSearch,
  ShoppingCart, Warehouse, CreditCard, BarChart3, Settings,
  ClipboardList, Clock, ShieldCheck, GitBranch, ChevronLeft,
  Zap, TrendingDown, AlertTriangle, History, Users, Bell,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { useWorkspaceStore } from '@/store/workspace-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { getNavForRole } from '@/config/nav-roles'
import type { NavItem } from '@/config/nav'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, Building2, Package, FileText, FileSearch,
  ShoppingCart, Warehouse, CreditCard, BarChart3, Settings,
  ClipboardList, Clock, ShieldCheck, GitBranch, TrendingDown,
  AlertTriangle, History, Users, Bell,
}

function NavIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = iconMap[name] ?? LayoutDashboard
  return <Icon className={cn('h-[15px] w-[15px]', className)} style={style} />
}

function SidebarItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()

  // Build isActive so that:
  // - /inventory       is active ONLY on /inventory (exact) or direct children like /inventory?...
  //   but NOT on /inventory/warehouses (that's a different nav item)
  // - /inventory/warehouses is active on /inventory/warehouses and /inventory/warehouses/*
  // - /analytics sub-pages use exact match to prevent parent highlighting
  //
  // Rule: split href and pathname into segments.
  // A nav item is active when:
  //   1. pathname === item.href  (exact match always works)
  //   2. pathname starts with item.href + '/' AND the item.href has MORE than 1 segment
  //      (i.e. item.href is already a deep path like /inventory/warehouses)
  //   3. For single-segment paths (/inventory, /payments, etc.):
  //      ONLY exact match — never match children that are separate nav items

  const hrefSegments = item.href.split('/').filter(Boolean)
  const isDeepPath = hrefSegments.length >= 2           // e.g. /inventory/warehouses
  const useExactMatch = item.href.startsWith('/analytics') || item.href === '/settings' || !isDeepPath

  const isActive = useExactMatch
    ? pathname === item.href
    : (pathname === item.href || pathname.startsWith(item.href + '/'))

  const content = (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] font-medium',
        'transition-all duration-200',
        isActive
          ? 'text-white'
          : 'text-[--color-sidebar-muted] hover:bg-[--color-sidebar-hover] hover:text-[--color-sidebar-fg]',
        collapsed && 'justify-center px-0 w-10 mx-auto rounded-xl',
      )}
      style={isActive ? {
        background: 'rgba(79,140,255,0.15)',
        border: '1px solid rgba(79,140,255,0.35)',
        boxShadow: '0 0 12px rgba(79,140,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
        color: '#93c5fd',
      } : undefined}
    >
      {/* Active left glow bar */}
      {isActive && !collapsed && (
        <span className="absolute left-0 inset-y-2 w-[3px] rounded-r-full" style={{ background: 'linear-gradient(to bottom, #93c5fd, #4F8CFF)' }} />
      )}

      <NavIcon
        name={item.iconName}
        className={cn('shrink-0 transition-colors')}
        style={isActive ? { color: '#93c5fd' } : undefined}
      />

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.16 }}
            className="overflow-hidden whitespace-nowrap flex-1"
            style={isActive ? { color: '#93c5fd' } : undefined}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Count badge */}
      {!collapsed && item.badge != null && (
        <span className="ml-auto min-w-[18px] rounded-full bg-[--color-sidebar-active]/25 px-1.5 py-0.5 text-center text-[10px] font-semibold text-[--color-sidebar-active]">
          {item.badge}
        </span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

export function Sidebar({
  initialRole = 'viewer',
  workspaceName: workspaceNameProp,
}: {
  initialRole?: string
  workspaceName?: string
}) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { currentWorkspace, currentUser } = useWorkspaceStore()

  const roleSlug =
    initialRole !== 'viewer' ? initialRole : (currentUser?.role ?? initialRole)
  const navGroups = getNavForRole(roleSlug)
  const displayName = workspaceNameProp ?? currentWorkspace?.name ?? 'VendorFlow'
  const plan = currentWorkspace?.plan ?? 'free'

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'relative flex h-screen flex-col shrink-0 overflow-hidden',
          'bg-[--color-sidebar-bg]',
          // Subtle right border
          'border-r border-[--color-sidebar-border]',
          'z-[--z-sidebar]',
        )}
      >
        {/* ── Workspace header ──────────────────────────────── */}
        <div
          className={cn(
            'flex h-[57px] shrink-0 items-center',
            'border-b border-[--color-sidebar-border]',
            sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4',
          )}
        >
          {/* Logo mark */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #4F8CFF, #8B5CF6)', boxShadow: '0 2px 12px rgba(79,140,255,0.4)' }}>
            <Zap className="h-[15px] w-[15px] text-white" />
          </div>

          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.16 }}
                className="overflow-hidden min-w-0 flex-1"
              >
                <p className="truncate text-[13px] font-semibold text-[--color-sidebar-fg] leading-tight">
                  {displayName}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
                  <span className="text-[10px] capitalize text-[--color-sidebar-muted]">
                    {plan} plan
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Navigation ────────────────────────────────────── */}
        <ScrollArea className="flex-1 py-2">
          <nav className={cn('px-2', sidebarCollapsed && 'flex flex-col items-center')}>
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="mb-4 w-full">
                {/* Section label */}
                <AnimatePresence initial={false}>
                  {!sidebarCollapsed && group.label && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="mb-1.5 px-2.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-[--color-sidebar-muted]/70"
                    >
                      {group.label}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Collapsed divider between groups */}
                {sidebarCollapsed && gIdx > 0 && (
                  <div className="mb-3 mt-1 w-8 border-t border-[--color-sidebar-border]" />
                )}

                <ul className="space-y-0.5 w-full" role="list">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <SidebarItem item={item} collapsed={sidebarCollapsed} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* ── Collapse toggle ───────────────────────────────── */}
        <div className="shrink-0 border-t border-[--color-sidebar-border] p-2">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]',
              'text-[--color-sidebar-muted] transition-all duration-150',
              'hover:bg-[--color-sidebar-hover] hover:text-[--color-sidebar-fg]',
              sidebarCollapsed && 'justify-center px-0 w-10 mx-auto',
            )}
          >
            <motion.div
              animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.22 }}
            >
              <ChevronLeft className="h-[15px] w-[15px]" />
            </motion.div>
            <AnimatePresence initial={false}>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.16 }}
                  className="overflow-hidden whitespace-nowrap font-medium"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
