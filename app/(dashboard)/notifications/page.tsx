'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, ListFilter as Filter, Search, FileText, Building2, Package, CreditCard, TriangleAlert as AlertTriangle, ShoppingCart, Clock, CircleCheck as CheckCircle2, Circle as XCircle, Trash2, Settings } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ── Types ────────────────────────────────────────────────────────────────────

type NotifType =
  | 'approval_required'
  | 'approval_completed'
  | 'approval_rejected'
  | 'rfq_created'
  | 'rfq_expiring'
  | 'quotation_received'
  | 'quotation_accepted'
  | 'po_created'
  | 'po_approved'
  | 'po_delivered'
  | 'invoice_received'
  | 'invoice_approved'
  | 'payment_completed'
  | 'vendor_registered'
  | 'low_stock'
  | 'system'

interface Notification {
  id: string
  type: NotifType
  title: string
  description: string
  timestamp: string
  read: boolean
  href?: string
  priority: 'high' | 'medium' | 'low'
  actor?: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'approval_required',
    title: 'Approval Required — PO-2024-1234',
    description: 'A purchase order for ₹4,85,000 from TechSupply Co. requires your approval.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    href: '/approvals',
    priority: 'high',
    actor: 'Rahul Sharma',
  },
  {
    id: 'n2',
    type: 'quotation_received',
    title: 'New Quotation — RFQ-2024-0847',
    description: 'TechSupply Co. submitted a quotation of ₹75,000 for Industrial Sensors.',
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    read: false,
    href: '/quotations',
    priority: 'medium',
    actor: 'TechSupply Co.',
  },
  {
    id: 'n3',
    type: 'low_stock',
    title: 'Low Stock Alert — 3 Items',
    description: 'Fastener Kit FT-200, Bearing XC-44, and 1 other item are below reorder level.',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    read: false,
    href: '/inventory?filter=low_stock',
    priority: 'high',
  },
  {
    id: 'n4',
    type: 'po_approved',
    title: 'Purchase Order Approved — PO-2024-1123',
    description: '₹48,500 order from ElectroComponents Ltd. has been approved by Finance.',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    read: false,
    href: '/purchase-orders',
    priority: 'medium',
    actor: 'Priya Menon',
  },
  {
    id: 'n5',
    type: 'vendor_registered',
    title: 'New Vendor Registered — Swift Logistics',
    description: 'Swift Logistics has completed onboarding and is pending verification.',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    read: true,
    href: '/vendors',
    priority: 'medium',
    actor: 'System',
  },
  {
    id: 'n6',
    type: 'invoice_received',
    title: 'Invoice Received — INV-8841',
    description: 'Global Materials Inc. submitted invoice INV-8841 for ₹12,750.',
    timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    read: true,
    href: '/payments/invoices',
    priority: 'medium',
    actor: 'Global Materials Inc.',
  },
  {
    id: 'n7',
    type: 'rfq_expiring',
    title: 'RFQ Expiring Tomorrow — RFQ-2024-0845',
    description: 'Network Switches RFQ closes in 18 hours. Only 3 of 5 vendors have responded.',
    timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    read: true,
    href: '/rfqs',
    priority: 'high',
  },
  {
    id: 'n8',
    type: 'payment_completed',
    title: 'Payment Processed — INV-8820',
    description: 'Payment of ₹32,750 to DataSoft Solutions has been successfully processed.',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    read: true,
    href: '/payments/history',
    priority: 'low',
    actor: 'Anita Kapoor',
  },
  {
    id: 'n9',
    type: 'approval_rejected',
    title: 'Request Rejected — PR-2024-0512',
    description: 'Your purchase request for Lab Equipment has been rejected. Reason: Budget exceeded.',
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    read: true,
    href: '/approvals',
    priority: 'medium',
    actor: 'Kiran Patel',
  },
  {
    id: 'n10',
    type: 'po_delivered',
    title: 'Delivery Confirmed — PO-2024-1121',
    description: 'Aluminum Sheets delivery from Global Materials Inc. has been confirmed.',
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    read: true,
    href: '/purchase-orders',
    priority: 'low',
    actor: 'Warehouse Team',
  },
  {
    id: 'n11',
    type: 'system',
    title: 'System Update — New Features Available',
    description: 'VendorFlow has been updated with enhanced analytics and approval workflow improvements.',
    timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    read: true,
    priority: 'low',
  },
  {
    id: 'n12',
    type: 'quotation_accepted',
    title: 'Quotation Approved — QT-2024-0623',
    description: 'Your quotation from ProServices Group has been approved for Office Furniture.',
    timestamp: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    read: true,
    href: '/quotations',
    priority: 'medium',
    actor: 'Procurement Team',
  },
]

// ── Icon & color helpers ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; bg: string; text: string }> = {
  approval_required: { icon: Clock, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  approval_completed: { icon: CheckCircle2, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  approval_rejected: { icon: XCircle, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  rfq_created: { icon: FileText, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  rfq_expiring: { icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  quotation_received: { icon: FileText, bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  quotation_accepted: { icon: CheckCircle2, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  po_created: { icon: ShoppingCart, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  po_approved: { icon: CheckCircle2, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  po_delivered: { icon: Package, bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  invoice_received: { icon: FileText, bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  invoice_approved: { icon: CheckCircle2, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  payment_completed: { icon: CreditCard, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  vendor_registered: { icon: Building2, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  low_stock: { icon: AlertTriangle, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  system: { icon: Bell, bg: 'bg-[--color-muted]', text: 'text-[--color-foreground-muted]' },
}

const PRIORITY_BADGE: Record<Notification['priority'], React.ReactNode> = {
  high: <Badge variant="error" className="text-[10px] py-0 px-1.5">High</Badge>,
  medium: <Badge variant="warning" className="text-[10px] py-0 px-1.5">Medium</Badge>,
  low: <Badge variant="outline" className="text-[10px] py-0 px-1.5">Low</Badge>,
}

const TYPE_LABELS: Record<NotifType, string> = {
  approval_required: 'Approvals',
  approval_completed: 'Approvals',
  approval_rejected: 'Approvals',
  rfq_created: 'RFQs',
  rfq_expiring: 'RFQs',
  quotation_received: 'Quotations',
  quotation_accepted: 'Quotations',
  po_created: 'Orders',
  po_approved: 'Orders',
  po_delivered: 'Orders',
  invoice_received: 'Finance',
  invoice_approved: 'Finance',
  payment_completed: 'Finance',
  vendor_registered: 'Vendors',
  low_stock: 'Inventory',
  system: 'System',
}

const FILTERS = ['All', 'Unread', 'Approvals', 'RFQs', 'Quotations', 'Orders', 'Finance', 'Vendors', 'Inventory', 'System']

// ── NotificationRow component ─────────────────────────────────────────────────

function NotificationRow({
  notif,
  onMarkRead,
  onDelete,
}: {
  notif: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const cfg = TYPE_CONFIG[notif.type]
  const Icon = cfg.icon
  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true }) }
    catch { return '' }
  })()

  const inner = (
    <div
      className={cn(
        'group relative flex items-start gap-4 rounded-xl border px-5 py-4 transition-all',
        notif.read
          ? 'border-[--color-border] bg-[--color-card]'
          : 'border-[--color-primary]/20 bg-[--color-primary]/[0.03]',
      )}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span className="absolute left-2.5 top-5 h-2 w-2 rounded-full bg-[--color-primary]" />
      )}

      {/* Icon */}
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', cfg.bg)}>
        <Icon className={cn('h-5 w-5', cfg.text)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <p className={cn('text-sm leading-snug', notif.read ? 'font-normal text-[--color-foreground]' : 'font-semibold text-[--color-foreground]')}>
              {notif.title}
            </p>
            {PRIORITY_BADGE[notif.priority]}
          </div>
          <time className="shrink-0 text-xs text-[--color-foreground-subtle]">{timeAgo}</time>
        </div>
        <p className="mt-1 text-sm text-[--color-foreground-muted] leading-relaxed">{notif.description}</p>
        {notif.actor && (
          <p className="mt-1 text-xs text-[--color-foreground-subtle]">By {notif.actor}</p>
        )}
      </div>

      {/* Actions — visible on hover */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notif.read && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkRead(notif.id) }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[--color-foreground-muted] hover:bg-[--color-border] hover:text-[--color-foreground] transition-colors"
            aria-label="Mark as read"
            title="Mark as read"
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(notif.id) }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[--color-foreground-muted] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
          aria-label="Delete notification"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )

  if (notif.href) {
    return (
      <Link href={notif.href} onClick={() => onMarkRead(notif.id)} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] rounded-xl">
        {inner}
      </Link>
    )
  }
  return <div>{inner}</div>
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')

  const unreadCount = notifications.filter((n) => !n.read).length

  const filtered = notifications.filter((n) => {
    const matchFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Unread' && !n.read) ||
      TYPE_LABELS[n.type] === activeFilter
    const matchSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function deleteNotif(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  function clearAll() {
    setNotifications((prev) => prev.filter((n) => !n.read))
  }

  // Group by date
  const groups: Record<string, Notification[]> = {}
  for (const n of filtered) {
    const d = new Date(n.timestamp)
    const now = new Date()
    let label: string
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) label = 'Today'
    else if (diffDays === 1) label = 'Yesterday'
    else if (diffDays < 7) label = 'This Week'
    else label = 'Older'
    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  }
  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older']

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-[--color-border] bg-[--color-background] px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[--color-primary]/10 text-[--color-primary]">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[--color-primary] text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[--color-foreground]">Notifications</h1>
              <p className="text-sm text-[--color-foreground-muted]">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5 text-[--color-foreground-muted]">
              <Trash2 className="h-3.5 w-3.5" />
              Clear read
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings?tab=notifications">
                <Settings className="h-3.5 w-3.5" />
                Preferences
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-6 space-y-5">
        {/* Search + Filter bar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--color-foreground-muted]" />
            <Input
              placeholder="Search notifications…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const count = f === 'Unread'
                ? notifications.filter((n) => !n.read).length
                : f === 'All'
                ? notifications.length
                : notifications.filter((n) => TYPE_LABELS[n.type] === f).length
              if (count === 0 && f !== 'All' && f !== 'Unread') return null
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    activeFilter === f
                      ? 'bg-[--color-primary] text-white'
                      : 'bg-[--color-muted] text-[--color-foreground-muted] hover:bg-[--color-accent] hover:text-[--color-foreground]',
                  )}
                >
                  {f}
                  {count > 0 && (
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      activeFilter === f ? 'bg-white/20' : 'bg-[--color-border]',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notification groups */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[--color-border] bg-[--color-card] py-20 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[--color-muted]">
              <Bell className="h-8 w-8 text-[--color-foreground-subtle]" />
            </div>
            <h3 className="text-base font-semibold text-[--color-foreground]">
              {search ? 'No matching notifications' : activeFilter === 'Unread' ? "You're all caught up!" : 'No notifications'}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[--color-foreground-muted]">
              {search
                ? 'Try adjusting your search terms.'
                : activeFilter === 'Unread'
                ? 'All notifications have been read.'
                : 'Notifications from procurement events will appear here.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {groupOrder.map((label) => {
              const group = groups[label]
              if (!group?.length) return null
              return (
                <div key={label}>
                  <div className="mb-3 flex items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
                      {label}
                    </p>
                    <div className="flex-1 h-px bg-[--color-border]" />
                    <span className="text-xs text-[--color-foreground-subtle]">{group.length}</span>
                  </div>
                  <AnimatePresence initial={false}>
                    <div className="space-y-2">
                      {group.map((n, i) => (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <NotificationRow
                            notif={n}
                            onMarkRead={markRead}
                            onDelete={deleteNotif}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
