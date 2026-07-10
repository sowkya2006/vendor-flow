'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, FileSearch, ShoppingCart,
  Receipt, CreditCard, Bell, User, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VendorUser } from '@/types/vendor-portal'

interface NavItem { label: string; href: string; icon: LucideIcon }

const NAV: NavItem[] = [
  { label: 'Dashboard',       href: '/vendor/dashboard',        icon: LayoutDashboard },
  { label: 'RFQs',            href: '/vendor/rfqs',             icon: FileText },
  { label: 'Quotations',      href: '/vendor/quotations',       icon: FileSearch },
  { label: 'Purchase Orders', href: '/vendor/purchase-orders',  icon: ShoppingCart },
  { label: 'Invoices',        href: '/vendor/invoices',         icon: Receipt },
  { label: 'Payments',        href: '/vendor/payments',         icon: CreditCard },
  { label: 'Notifications',   href: '/vendor/notifications',    icon: Bell },
  { label: 'Profile',         href: '/vendor/profile',          icon: User },
]

export function VendorPortalSidebar({ vendorUser }: { vendorUser: VendorUser }) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[--color-card] border-r border-[--color-border] h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-16 px-5 border-b border-[--color-border] shrink-0">
        <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary] shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 4h10M3 8h7M3 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[--color-foreground] truncate">VendorFlow</p>
          <p className="text-[10px] text-[--color-primary] font-semibold">Vendor Portal</p>
        </div>
      </div>

      {/* Vendor info */}
      <div className="px-4 py-3 border-b border-[--color-border] bg-[--color-background-subtle]">
        <p className="text-xs font-semibold text-[--color-foreground] truncate">{vendorUser.vendor?.name ?? 'My Company'}</p>
        <p className="text-[11px] text-[--color-foreground-muted] truncate">{vendorUser.email ?? ''}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-[--color-primary]/10 text-[--color-primary]'
                  : 'text-[--color-foreground-muted] hover:bg-[--color-background-subtle] hover:text-[--color-foreground]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
