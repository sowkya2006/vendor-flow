import React from 'react'
import Link from 'next/link'
import { ExternalLink, Building2, FileText, ShoppingCart, PackageOpen } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import {
  getRecentVendors,
  getRecentRfqs,
  getRecentPurchaseOrders,
} from '@/lib/supabase/dashboard'
import { getCompanyId } from '@/lib/supabase/get-company-id'

// ── Status badge ──────────────────────────────────────────────────────────────
// Maps status strings → tailwind color classes (bg + text + border)
const STATUS_STYLES: Record<string, string> = {
  active:           'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900',
  pending:          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900',
  suspended:        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900',
  inactive:         'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700',
  draft:            'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700',
  sent:             'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900',
  under_review:     'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-900',
  awarded:          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900',
  cancelled:        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900',
  approved:         'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900',
  completed:        'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-400 dark:border-cyan-900',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900',
  in_progress:      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900',
  acknowledged:     'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-900',
  sent_to_vendor:   'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-900',
  received:         'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900',
  partially_received:'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900',
  published:        'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900',
  closed:           'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700',
}

// Dot color that matches the text color of the badge
const DOT_STYLES: Record<string, string> = {
  active:           'bg-emerald-500',
  pending:          'bg-amber-500',
  suspended:        'bg-red-500',
  inactive:         'bg-gray-400',
  draft:            'bg-gray-400',
  sent:             'bg-blue-500',
  under_review:     'bg-violet-500',
  awarded:          'bg-emerald-500',
  cancelled:        'bg-red-500',
  approved:         'bg-emerald-500',
  completed:        'bg-cyan-500',
  pending_approval: 'bg-amber-500',
  in_progress:      'bg-blue-500',
  acknowledged:     'bg-teal-500',
  sent_to_vendor:   'bg-sky-500',
  received:         'bg-emerald-500',
  partially_received:'bg-blue-500',
  published:        'bg-indigo-500',
  closed:           'bg-gray-400',
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  const dot   = DOT_STYLES[status]   ?? 'bg-gray-400'
  const label = status.replace(/_/g, ' ')

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
      'text-[11px] font-medium capitalize whitespace-nowrap',
      style
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
      {label}
    </span>
  )
}

// ── Shared table chrome ───────────────────────────────────────────────────────
const tableCard = 'rounded-xl border border-[--color-border] bg-[--color-card] shadow-[var(--shadow-sm)] overflow-hidden'
const tableHeader = 'flex items-center justify-between border-b border-[--color-border] px-5 py-4'
const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[--color-foreground-muted] bg-[--color-background-subtle] sticky top-0 z-[1]'
const td = 'px-4 py-3 text-sm text-[--color-foreground]'

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyTable({ icon: Icon, message, sub }: {
  icon: React.ElementType
  message: string
  sub: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[--color-background-muted]">
        <Icon className="h-5 w-5 text-[--color-foreground-subtle]" />
      </div>
      <p className="text-sm font-medium text-[--color-foreground-muted]">{message}</p>
      <p className="text-xs text-[--color-foreground-subtle]">{sub}</p>
    </div>
  )
}

// ── Vendors Table ─────────────────────────────────────────────────────────────
export async function RecentVendorsTable() {
  let vendors: Awaited<ReturnType<typeof getRecentVendors>> = []
  try {
    const companyId = await getCompanyId()
    vendors = await getRecentVendors(companyId)
  } catch { /* not authenticated */ }

  return (
    <div className={tableCard}>
      <div className={tableHeader}>
        <div>
          <h3 className="text-[15px] font-semibold text-[--color-foreground]">Recent Vendors</h3>
          <p className="text-xs text-[--color-foreground-muted] mt-0.5">Latest onboarded vendor accounts</p>
        </div>
        <Link href="/vendors" className="text-xs font-medium text-[--color-primary] hover:underline underline-offset-2 transition-colors">
          View all →
        </Link>
      </div>

      <div className="overflow-x-auto">
        {vendors.length === 0 ? (
          <EmptyTable icon={Building2} message="No vendors yet" sub="Onboard your first vendor to get started." />
        ) : (
          <table className="w-full min-w-[520px] table-enterprise">
            <thead>
              <tr>
                <th className={th}>Vendor</th>
                <th className={th}>Category</th>
                <th className={th}>Status</th>
                <th className={th}>Added</th>
                <th className={cn(th, 'text-right')}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="group transition-colors hover:bg-[--color-background-subtle]"
                >
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[11px] font-bold text-[--color-primary]">
                        {vendor.initials}
                      </div>
                      <p className="font-medium truncate max-w-[160px]">{vendor.name}</p>
                    </div>
                  </td>
                  <td className={td}>
                    <span className="text-xs text-[--color-foreground-muted] capitalize">
                      {vendor.category ?? '—'}
                    </span>
                  </td>
                  <td className={td}>
                    <StatusBadge status={vendor.status} />
                  </td>
                  <td className={td}>
                    <span className="text-xs text-[--color-foreground-muted]">
                      {formatDate(vendor.created_at)}
                    </span>
                  </td>
                  <td className={cn(td, 'text-right')}>
                    <Link
                      href={`/vendors/${vendor.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[--color-primary] opacity-0 group-hover:opacity-100 hover:bg-[--color-primary]/10 transition-all"
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── RFQs Table ────────────────────────────────────────────────────────────────
export async function RecentRfqsTable() {
  let rfqs: Awaited<ReturnType<typeof getRecentRfqs>> = []
  try {
    const companyId = await getCompanyId()
    rfqs = await getRecentRfqs(companyId)
  } catch { /* not authenticated */ }

  return (
    <div className={tableCard}>
      <div className={tableHeader}>
        <div>
          <h3 className="text-[15px] font-semibold text-[--color-foreground]">Recent RFQs</h3>
          <p className="text-xs text-[--color-foreground-muted] mt-0.5">Latest requests for quotation</p>
        </div>
        <Link href="/rfqs" className="text-xs font-medium text-[--color-primary] hover:underline underline-offset-2 transition-colors">
          View all →
        </Link>
      </div>

      <div className="overflow-x-auto">
        {rfqs.length === 0 ? (
          <EmptyTable icon={FileText} message="No RFQs yet" sub="Create your first RFQ to start collecting quotations." />
        ) : (
          <table className="w-full min-w-[560px] table-enterprise">
            <thead>
              <tr>
                <th className={th}>RFQ Number</th>
                <th className={th}>Vendor</th>
                <th className={th}>Status</th>
                <th className={cn(th, 'text-right')}>Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {rfqs.map((rfq) => (
                <tr
                  key={rfq.id}
                  className="transition-colors hover:bg-[--color-background-subtle]"
                >
                  <td className={td}>
                    <Link href={`/rfqs/${rfq.id}`} className="block group/link">
                      <p className="font-semibold text-[--color-primary] group-hover/link:underline underline-offset-2">
                        {rfq.rfq_number}
                      </p>
                      <p className="text-[11px] text-[--color-foreground-muted] truncate max-w-[200px] mt-0.5">
                        {rfq.title}
                      </p>
                    </Link>
                  </td>
                  <td className={td}>
                    <span className="text-xs text-[--color-foreground-muted]">{rfq.vendor_name ?? '—'}</span>
                  </td>
                  <td className={td}>
                    <StatusBadge status={rfq.status} />
                  </td>
                  <td className={cn(td, 'text-right')}>
                    <span className="text-xs text-[--color-foreground-muted]">
                      {rfq.due_date ? formatDate(rfq.due_date) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Purchase Orders Table ─────────────────────────────────────────────────────
export async function RecentPurchaseOrdersTable() {
  let pos: Awaited<ReturnType<typeof getRecentPurchaseOrders>> = []
  try {
    const companyId = await getCompanyId()
    pos = await getRecentPurchaseOrders(companyId)
  } catch { /* not authenticated */ }

  return (
    <div className={tableCard}>
      <div className={tableHeader}>
        <div>
          <h3 className="text-[15px] font-semibold text-[--color-foreground]">Purchase Orders</h3>
          <p className="text-xs text-[--color-foreground-muted] mt-0.5">Recent purchase order activity</p>
        </div>
        <Link href="/purchase-orders" className="text-xs font-medium text-[--color-primary] hover:underline underline-offset-2 transition-colors">
          View all →
        </Link>
      </div>

      <div className="overflow-x-auto">
        {pos.length === 0 ? (
          <EmptyTable icon={ShoppingCart} message="No purchase orders yet" sub="Raise your first purchase order to get started." />
        ) : (
          <table className="w-full min-w-[560px] table-enterprise">
            <thead>
              <tr>
                <th className={th}>PO Number</th>
                <th className={th}>Vendor</th>
                <th className={th}>Status</th>
                <th className={th}>Due Date</th>
                <th className={cn(th, 'text-right')}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {pos.map((po) => (
                <tr
                  key={po.id}
                  className="group transition-colors hover:bg-[--color-background-subtle]"
                >
                  <td className={td}>
                    <Link
                      href={`/purchase-orders/${po.id}`}
                      className="font-semibold text-[--color-primary] hover:underline underline-offset-2"
                    >
                      {po.po_number}
                    </Link>
                  </td>
                  <td className={td}>
                    <span className="text-xs text-[--color-foreground-muted]">{po.vendor_name ?? '—'}</span>
                  </td>
                  <td className={td}>
                    <StatusBadge status={po.status} />
                  </td>
                  <td className={td}>
                    <span className="text-xs text-[--color-foreground-muted]">
                      {po.due_date ? formatDate(po.due_date) : '—'}
                    </span>
                  </td>
                  <td className={cn(td, 'text-right')}>
                    <span className="text-sm font-semibold tabular-nums">
                      {po.total_amount != null ? formatCurrency(po.total_amount) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
