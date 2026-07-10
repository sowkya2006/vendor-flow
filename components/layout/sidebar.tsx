'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  Package,
  FileText,
  FileSearch,
  ShoppingCart,
  Warehouse,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
  Clock,
  ShieldCheck,
  GitBranch,
  ChevronLeft,
  Zap,
  TrendingDown,
  AlertTriangle,
  History,
  Users,
  ClipboardPlus,
  Store,
  Truck,
  MessageSquare,
  FileBarChart2,
  PackageCheck,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { useWorkspaceStore } from '@/store/workspace-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { mainNav, type NavGroup, type NavItem } from '@/config/nav'
import { getNavForRole } from '@/config/nav-roles'

// Map icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  Package,
  FileText,
  FileSearch,
  ShoppingCart,
  Warehouse,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
  Clock,
  ShieldCheck,
  GitBranch,
  TrendingDown,
  AlertTriangle,
  History,
  Users,
  ClipboardPlus,
  Store,
  Truck,
  MessageSquare,
  FileBarChart2,
  PackageCheck,
  Bell,
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? LayoutDashboard
  return <Icon className={cn('h-4 w-4', className)} />
}

interface SidebarItemProps {
  item: NavItem
  collapsed: boolean
}

function SidebarItem({ item, collapsed }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  const content = (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'text-[--color-sidebar-muted] hover:bg-[--color-sidebar-hover] hover:text-[--color-sidebar-fg]',
        isActive && 'bg-[--color-sidebar-active] text-white hover:bg-[--color-sidebar-active]',
        collapsed && 'justify-center px-2'
      )}
    >
      <NavIcon name={item.iconName} className="shrink-0" />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && item.badge != null && (
        <span className="ml-auto rounded-full bg-[--color-primary]/20 px-1.5 py-0.5 text-xs font-semibold text-[--color-primary]">
          {item.badge}
        </span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { currentWorkspace, currentUser } = useWorkspaceStore()

  // Filter nav based on the current user's role
  const roleSlug = currentUser?.role ?? 'member'
  const navGroups = getNavForRole(roleSlug)

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'relative flex h-screen flex-col border-r border-[--color-sidebar-border]',
          'bg-[--color-sidebar-bg] text-[--color-sidebar-fg]',
          'z-[--z-sidebar] shrink-0'
        )}
      >
        {/* Logo / Workspace */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-[--color-sidebar-border]',
            sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[--color-primary]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="whitespace-nowrap text-sm font-semibold text-[--color-sidebar-fg]">
                  {currentWorkspace?.name ?? 'VendorFlow'}
                </p>
                <p className="whitespace-nowrap text-xs text-[--color-sidebar-muted] capitalize">
                  {currentWorkspace?.plan ?? 'free'} plan
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-4">
                <AnimatePresence initial={false}>
                  {!sidebarCollapsed && group.label && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[--color-sidebar-muted]"
                    >
                      {group.label}
                    </motion.p>
                  )}
                </AnimatePresence>
                <ul className="space-y-0.5" role="list">
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

        {/* Collapse toggle */}
        <div className="border-t border-[--color-sidebar-border] p-2">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[--color-sidebar-muted]',
              'hover:bg-[--color-sidebar-hover] hover:text-[--color-sidebar-fg] transition-colors',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronLeft className="h-4 w-4" />
            </motion.div>
            <AnimatePresence initial={false}>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
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
