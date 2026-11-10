'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, FileSearch, ShoppingCart,
  Receipt, CreditCard, Bell, User, Building2, Send,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VendorUser } from '@/types/vendor-portal'

interface NavItem { label: string; href: string; icon: LucideIcon }

const NAV: NavItem[] = [
  { label: 'Dashboard',       href: '/vendor/dashboard',        icon: LayoutDashboard },
  { label: 'Discover Companies', href: '/vendor/companies',     icon: Building2 },
  { label: 'My Requests',     href: '/vendor/requests',         icon: Send },
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
    <aside
      className="hidden lg:flex flex-col w-60 shrink-0 h-full border-r"
      style={{
        background: '#070B16',
        borderColor: 'rgba(139,159,232,0.15)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 h-16 px-5 shrink-0 border-b"
        style={{ borderColor: 'rgba(139,159,232,0.15)' }}
      >
        <div
          className="flex items-center justify-center size-8 rounded-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #8B9FE8, #C9A84C)', boxShadow: '0 2px 12px rgba(139,159,232,0.5)' }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 4h10M3 8h7M3 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">VendorFlow</p>
          <p className="text-[10px] font-semibold" style={{ color: '#C9A84C' }}>Vendor Portal</p>
        </div>
      </div>

      {/* Vendor info */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: 'rgba(139,159,232,0.12)', background: 'rgba(139,159,232,0.05)' }}
      >
        <p className="text-xs font-semibold text-white truncate">{vendorUser.vendor?.name ?? 'My Company'}</p>
        <p className="text-[11px] truncate" style={{ color: '#8B96B4' }}>{vendorUser.email ?? ''}</p>
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
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
              )}
              style={active ? {
                background: 'rgba(139,159,232,0.18)',
                border: '1px solid rgba(139,159,232,0.38)',
                color: '#A5B6F0',
                boxShadow: '0 0 12px rgba(139,159,232,0.12)',
              } : {
                color: '#8B96B4',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(139,159,232,0.08)'
                  e.currentTarget.style.color = '#D4DAEB'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#8B96B4'
                }
              }}
            >
              <Icon className="h-4 w-4 shrink-0" style={active ? { color: '#C9A84C' } : {}} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
