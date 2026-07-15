'use client'

import Link from 'next/link'
import {
  UserPlus, FilePlus, CheckCircle2, ShoppingCart, ClipboardList,
  CreditCard, FileText, BarChart3,
} from 'lucide-react'

const ACTIONS = [
  { label: 'Add Vendor',     href: '/vendors/new',            icon: UserPlus,      color: '#4F8CFF', glow: 'rgba(79,140,255,0.3)' },
  { label: 'Create RFQ',    href: '/rfqs/new',               icon: FilePlus,      color: '#8B5CF6', glow: 'rgba(139,92,246,0.3)' },
  { label: 'Create PO',     href: '/purchase-orders/new',    icon: ShoppingCart,  color: '#22C55E', glow: 'rgba(34,197,94,0.3)'  },
  { label: 'Create GRN',    href: '/inventory/grn/new',      icon: ClipboardList, color: '#06B6D4', glow: 'rgba(6,182,212,0.3)'  },
  { label: 'Approve Invoice',href: '/payments/invoices',     icon: CheckCircle2,  color: '#FACC15', glow: 'rgba(250,204,21,0.3)' },
  { label: 'Pay Invoice',   href: '/payments/invoices',      icon: CreditCard,    color: '#F97316', glow: 'rgba(249,115,22,0.3)' },
  { label: 'View Invoices', href: '/payments/invoices',      icon: FileText,      color: '#EC4899', glow: 'rgba(236,72,153,0.3)' },
  { label: 'Analytics',     href: '/analytics',              icon: BarChart3,     color: '#A78BFA', glow: 'rgba(167,139,250,0.3)' },
]

export function GlassQuickActions() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      <h3 className="text-sm font-semibold text-white/60 mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ label, href, icon: Icon, color, glow }) => (
          <Link
            key={label}
            href={href}
            className="group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200 overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.background = `rgba(${color.replace('#','').match(/.{2}/g)?.map(h => parseInt(h,16)).join(',')},0.12)`
              el.style.borderColor = `${color}40`
              el.style.transform = 'translateY(-1px)'
              el.style.boxShadow = `0 8px 24px ${glow}`
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.background = 'rgba(255,255,255,0.04)'
              el.style.borderColor = 'rgba(255,255,255,0.07)'
              el.style.transform = ''
              el.style.boxShadow = ''
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${color}20`, border: `1px solid ${color}30` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </div>
            <span className="text-xs font-medium text-white/60 group-hover:text-white/90 transition-colors truncate">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
