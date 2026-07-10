import React from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import {
  getRecentVendors,
  getRecentRfqs,
  getRecentPurchaseOrders,
} from '@/lib/supabase/dashboard'
import { getCompanyId } from '@/lib/supabase/get-company-id'

// ── Shared helpers ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active:           'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
    pending:          'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400',
    suspended:        'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
    draft:            'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400',
    sent:             'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    under_review:     'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400',
    awarded:          'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
    cancelled:        'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
    approved:         'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
    completed:        'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400',
    pending_approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400',
    in_progress:      'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
    acknowledged:     'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400',
  }
  const label = status.replace(/_/g, ' ')
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', styles[status] ?? 'bg-gray-100 text-gray-600')}>
      {label}
    </span>
  )
}

const tableCard = 'rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] overflow-hidden'
const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[--color-foreground-muted]'
const td = 'px-4 py-3 text-sm text-[--color-foreground]'

// ── Vendors Table ─────────────────────────────────────────────────────────────
export async function RecentVendorsTable() {
  let vendors: Awaited<ReturnType<typeof getRecentVendors>> = []
  try {
    const companyId = await getCompanyId()
    vendors = await getRecentVendors(companyId)
  } catch { /* not authenticated */ }

  return (
    <div className={tableCard}>
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-[--color-foreground]">Recent Vendors</h3>
          <p className="text-xs text-[--color-foreground-muted] mt-0.5">Latest onboarded vendor accounts</p>
        </div>
        <Link href="/vendors" className="text-xs font-medium text-[--color-primary] hover:underline">View all</Link>
      </div>

      <div className="overflow-x-auto">
        {vendors.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-[--color-foreground-muted]">No vendors yet.</p>
        ) : (
          <table className="w-full min-w-[520px]">
            <thead className="bg-[--color-background-subtle]">
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
                <tr key={vendor.id} className="transition-colors hover:bg-[--color-background-subtle]">
                  <td className={td}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[--color-primary]/10 text-[10px] font-bold text-[--color-primary]">
                        {vendor.initials}
                      </div>
                      <p className="font-medium">{vendor.name}</p>
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
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[--color-primary] hover:bg-[--color-primary]/10 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />View
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
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-[--color-foreground]">Recent RFQs</h3>
          <p className="text-xs text-[--color-foreground-muted] mt-0.5">Latest requests for quotation</p>
        </div>
        <Link href="/rfqs" className="text-xs font-medium text-[--color-primary] hover:underline">View all</Link>
      </div>

      <div className="overflow-x-auto">
        {rfqs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-[--color-foreground-muted]">No RFQs yet.</p>
        ) : (
          <table className="w-full min-w-[560px]">
            <thead className="bg-[--color-background-subtle]">
              <tr>
                <th className={th}>RFQ Number</th>
                <th className={th}>Vendor</th>
                <th className={th}>Status</th>
                <th className={cn(th, 'text-right')}>Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border]">
              {rfqs.map((rfq) => (
                <tr key={rfq.id} className="transition-colors hover:bg-[--color-background-subtle]">
                  <td className={td}>
                    <Link href={`/rfqs/${rfq.id}`}>
                      <p className="font-medium text-[--color-primary] hover:underline">{rfq.rfq_number}</p>
                      <p className="text-[11px] text-[--color-foreground-muted] truncate max-w-[180px]">{rfq.title}</p>
                    </Link>
                  </td>
                  <td className={td}>
                    <span className="text-xs">{rfq.vendor_name ?? '—'}</span>
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
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-[--color-foreground]">Purchase Orders</h3>
          <p className="text-xs text-[--color-foreground-muted] mt-0.5">Recent purchase order activity</p>
        </div>
        <Link href="/purchase-orders" className="text-xs font-medium text-[--color-primary] hover:underline">View all</Link>
      </div>

      <div className="overflow-x-auto">
        {pos.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-[--color-foreground-muted]">No purchase orders yet.</p>
        ) : (
          <table className="w-full min-w-[560px]">
            <thead className="bg-[--color-background-subtle]">
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
                <tr key={po.id} className="transition-colors hover:bg-[--color-background-subtle]">
                  <td className={td}>
                    <Link href={`/purchase-orders/${po.id}`}>
                      <p className="font-medium text-[--color-primary] hover:underline">{po.po_number}</p>
                    </Link>
                  </td>
                  <td className={td}>
                    <span className="text-xs">{po.vendor_name ?? '—'}</span>
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
                    <span className="text-xs font-semibold">
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
