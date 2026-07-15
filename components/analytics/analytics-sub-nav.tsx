'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// All analytics tabs with which roles can see them
const ALL_TABS = [
  {
    href: '/analytics',
    label: 'Executive',
    roles: ['administrator', 'admin'], // Admin only — full overview
  },
  {
    href: '/analytics/procurement',
    label: 'Procurement',
    roles: ['administrator', 'admin', 'procurement_manager', 'procurement_officer'],
  },
  {
    href: '/analytics/vendors',
    label: 'Vendors',
    roles: ['administrator', 'admin', 'procurement_manager', 'procurement_officer'],
  },
  {
    href: '/analytics/inventory',
    label: 'Inventory',
    roles: ['administrator', 'admin', 'warehouse_manager'],
  },
  {
    href: '/analytics/finance',
    label: 'Finance',
    roles: ['administrator', 'admin', 'finance_manager'],
  },
  {
    href: '/analytics/approvals',
    label: 'Approvals',
    roles: ['administrator', 'admin', 'procurement_manager'],
  },
]

interface AnalyticsSubNavProps {
  /** Effective role (preview-aware) passed from server component */
  role: string
}

export function AnalyticsSubNav({ role }: AnalyticsSubNavProps) {
  const pathname = usePathname()
  const normalised = role === 'admin' ? 'administrator' : role

  const visibleTabs = ALL_TABS.filter((t) => t.roles.includes(normalised))

  if (visibleTabs.length === 0) return null

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-[--color-border] bg-[--color-card] p-1 shadow-[var(--shadow-sm)]">
      {visibleTabs.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-[--color-primary] text-white shadow-sm'
                : 'text-[--color-foreground-muted] hover:bg-[--color-background-subtle] hover:text-[--color-foreground]',
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
