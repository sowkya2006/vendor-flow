'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, FileSearch, ShoppingCart,
  Receipt, CreditCard, Bell, User, Building2, Send,
  type LucideIcon,
} from 'lucide-react'
import type { VendorUser } from '@/types/vendor-portal'

interface NavItem { label: string; href: string; icon: LucideIcon }

const NAV: NavItem[] = [
  { label: 'Dashboard',          href: '/vendor/dashboard',       icon: LayoutDashboard },
  { label: 'Discover Companies', href: '/vendor/companies',       icon: Building2 },
  { label: 'My Requests',        href: '/vendor/requests',        icon: Send },
  { label: 'RFQs',               href: '/vendor/rfqs',            icon: FileText },
  { label: 'Quotations',         href: '/vendor/quotations',      icon: FileSearch },
  { label: 'Purchase Orders',    href: '/vendor/purchase-orders', icon: ShoppingCart },
  { label: 'Invoices',           href: '/vendor/invoices',        icon: Receipt },
  { label: 'Payments',           href: '/vendor/payments',        icon: CreditCard },
  { label: 'Notifications',      href: '/vendor/notifications',   icon: Bell },
  { label: 'Profile',            href: '/vendor/profile',         icon: User },
]

export function VendorPortalSidebar({ vendorUser }: { vendorUser: VendorUser }) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-full border-r"
      style={{ background: '#3D5A5F', borderColor: 'rgba(255,255,255,0.10)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 h-16 px-5 shrink-0 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
        <div className="flex items-center justify-center size-8 rounded-lg shrink-0"
          style={{ background: 'rgba(255,255,255,0.20)' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 4h10M3 8h7M3 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">VendorFlow</p>
          <p className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>Vendor Portal</p>
        </div>
      </div>

      {/* Vendor info */}
      <div className="px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.12)' }}>
        <p className="text-xs font-semibold text-white truncate">{vendorUser.vendor?.name ?? 'My Company'}</p>
        <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{vendorUser.email ?? ''}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
              style={active ? {
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#FFFFFF',
              } : {
                color: 'rgba(255,255,255,0.65)',
                border: '1px solid transparent',
              }}
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
