'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/analytics', label: 'Executive' },
  { href: '/analytics/procurement', label: 'Procurement' },
  { href: '/analytics/vendors', label: 'Vendors' },
  { href: '/analytics/inventory', label: 'Inventory' },
  { href: '/analytics/finance', label: 'Finance' },
  { href: '/analytics/approvals', label: 'Approvals' },
]

export function AnalyticsSubNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-[--color-border] bg-[--color-card] p-1 shadow-[--shadow-sm]">
      {LINKS.map(({ href, label }) => {
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
