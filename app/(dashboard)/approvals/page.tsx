/**
 * Approvals page — shows all procurement entities grouped by approval status.
 * Does NOT use the approval_requests table (workflow module removed).
 * Reads directly from rfqs, quotations, and purchase_orders tables.
 */
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ClipboardList, Clock, CheckCircle2, XCircle, FileText, FileSearch, ShoppingCart,
} from 'lucide-react'
import { getCompanyId, getUserRole } from '@/lib/supabase/get-auth'
import { createClient } from '@/lib/supabase/server'
import { PageContainer } from '@/components/shared/page-container'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Approvals — VendorFlow' }
export const dynamic = 'force-dynamic'

// ── Types ────────────────────────────────────────────────────────────────────

type ApprovalItem = {
  id: string
  type: 'rfq' | 'quotation' | 'purchase_order'
  ref: string
  title: string
  status: string
  amount: number | null
  created_at: string
  link: string
  vendor?: string | null
}

// Status groupings
const PENDING_STATUSES = {
  rfq: ['draft', 'pending_approval'],
  quotation: ['submitted', 'under_review', 'shortlisted'],
  purchase_order: ['draft', 'pending_approval'],
}

const APPROVED_STATUSES = {
  rfq: ['approved', 'sent', 'awarded'],
  quotation: ['approved', 'selected', 'closed'],
  purchase_order: ['approved', 'sent', 'acknowledged', 'in_progress', 'completed'],
}

const REJECTED_STATUSES = {
  rfq: ['rejected', 'cancelled'],
  quotation: ['rejected', 'withdrawn'],
  purchase_order: ['rejected', 'cancelled'],
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusPill(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending_approval: 'bg-amber-100 text-amber-700',
    submitted: 'bg-amber-100 text-amber-700',
    under_review: 'bg-purple-100 text-purple-700',
    shortlisted: 'bg-blue-100 text-blue-700',
    approved: 'bg-emerald-100 text-emerald-700',
    sent: 'bg-cyan-100 text-cyan-700',
    awarded: 'bg-emerald-100 text-emerald-700',
    selected: 'bg-emerald-100 text-emerald-700',
    acknowledged: 'bg-teal-100 text-teal-700',
    in_progress: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    closed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-red-100 text-red-700',
    withdrawn: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

const TYPE_META = {
  rfq: { label: 'RFQ', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  quotation: { label: 'Quotation', icon: FileSearch, color: 'bg-purple-100 text-purple-600' },
  purchase_order: { label: 'Purchase Order', icon: ShoppingCart, color: 'bg-orange-100 text-orange-600' },
}

// ── Data fetching ────────────────────────────────────────────────────────────

async function fetchAllItems(companyId: string): Promise<{
  pending: ApprovalItem[]
  approved: ApprovalItem[]
  rejected: ApprovalItem[]
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const allPendingStatuses = [
    ...PENDING_STATUSES.rfq,
    ...PENDING_STATUSES.quotation,
    ...PENDING_STATUSES.purchase_order,
  ]
  const allApprovedStatuses = [
    ...APPROVED_STATUSES.rfq,
    ...APPROVED_STATUSES.quotation,
    ...APPROVED_STATUSES.purchase_order,
  ]
  const allRejectedStatuses = [
    ...REJECTED_STATUSES.rfq,
    ...REJECTED_STATUSES.quotation,
    ...REJECTED_STATUSES.purchase_order,
  ]

  const [rfqs, quotations, pos] = await Promise.all([
    supabase.from('rfqs').select('id, rfq_number, title, status, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(200),
    supabase.from('quotations').select('id, quotation_number, grand_total, status, created_at, vendor:vendors(name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(200),
    supabase.from('purchase_orders').select('id, po_number, total_amount, status, created_at, vendor:vendors(name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(200),
  ])

  const items: ApprovalItem[] = []

  for (const r of (rfqs.data ?? []) as { id: string; rfq_number: string; title: string; status: string; created_at: string }[]) {
    items.push({ id: r.id, type: 'rfq', ref: r.rfq_number, title: r.title, status: r.status, amount: null, created_at: r.created_at, link: `/rfqs/${r.id}` })
  }
  for (const r of (quotations.data ?? []) as { id: string; quotation_number: string; grand_total: number | null; status: string; created_at: string; vendor: { name: string } | null }[]) {
    items.push({ id: r.id, type: 'quotation', ref: r.quotation_number, title: r.vendor?.name ? `Quotation from ${r.vendor.name}` : r.quotation_number, status: r.status, amount: r.grand_total, created_at: r.created_at, link: `/quotations/${r.id}`, vendor: r.vendor?.name })
  }
  for (const r of (pos.data ?? []) as { id: string; po_number: string; total_amount: number | null; status: string; created_at: string; vendor: { name: string } | null }[]) {
    items.push({ id: r.id, type: 'purchase_order', ref: r.po_number, title: r.vendor?.name ? `PO for ${r.vendor.name}` : r.po_number, status: r.status, amount: r.total_amount, created_at: r.created_at, link: `/purchase-orders/${r.id}`, vendor: r.vendor?.name })
  }

  const pending  = items.filter((i) => allPendingStatuses.includes(i.status)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const approved = items.filter((i) => allApprovedStatuses.includes(i.status)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const rejected = items.filter((i) => allRejectedStatuses.includes(i.status)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return { pending, approved, rejected }
}

// ── Components ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-[--color-foreground-muted]">{label}</p>
          <p className="text-xl font-bold text-[--color-foreground]">{value}</p>
        </div>
      </div>
    </div>
  )
}

function ItemCard({ item }: { item: ApprovalItem }) {
  const meta = TYPE_META[item.type]
  const Icon = meta.icon
  return (
    <Link
      href={item.link}
      className="group flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] hover:border-[--color-primary]/30 transition-all"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[--color-foreground] group-hover:text-[--color-primary] transition-colors">
          {item.title}
          <span className="ml-1.5 font-normal text-[--color-foreground-muted]">· {item.ref}</span>
        </p>
        <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
          {meta.label} · {formatDate(item.created_at)}
        </p>
      </div>
      <span className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusPill(item.status)}`}>
        {item.status.replace(/_/g, ' ')}
      </span>
      {item.amount != null && (
        <span className="hidden lg:block text-sm font-semibold tabular-nums text-[--color-foreground]">
          {formatCurrency(item.amount)}
        </span>
      )}
    </Link>
  )
}

function Section({ title, icon: Icon, items, iconColor, emptyText }: {
  title: string; icon: React.ElementType; items: ApprovalItem[]
  iconColor: string; emptyText: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <h2 className="text-sm font-semibold text-[--color-foreground]">
          {title}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${iconColor.includes('amber') ? 'bg-amber-100 text-amber-700' : iconColor.includes('emerald') || iconColor.includes('green') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {items.length}
          </span>
        </h2>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[--color-border] bg-[--color-background-subtle] px-5 py-6 text-center">
          <p className="text-xs text-[--color-foreground-muted]">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => <ItemCard key={`${item.type}-${item.id}`} item={item} />)}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

async function ApprovalsContent({ companyId, tab }: { companyId: string; tab: string }) {
  const { pending, approved, rejected } = await fetchAllItems(companyId)
  const total = pending.length + approved.length + rejected.length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total"    value={total}            color="bg-[--color-primary]/10 text-[--color-primary]" />
        <StatCard icon={Clock}         label="Pending"  value={pending.length}   color="bg-amber-100 text-amber-600" />
        <StatCard icon={CheckCircle2}  label="Approved" value={approved.length}  color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={XCircle}       label="Rejected" value={rejected.length}  color="bg-red-100 text-red-600" />
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 border-b border-[--color-border] pb-0">
        {([
          { key: 'pending',  label: 'Pending',  count: pending.length },
          { key: 'approved', label: 'Approved', count: approved.length },
          { key: 'rejected', label: 'Rejected', count: rejected.length },
        ] as { key: string; label: string; count: number }[]).map(({ key, label, count }) => (
          <Link
            key={key}
            href={`/approvals?tab=${key}`}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-[--color-primary] text-[--color-primary]'
                : 'border-transparent text-[--color-foreground-muted] hover:text-[--color-foreground]'
            }`}
          >
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === key ? 'bg-[--color-primary]/10 text-[--color-primary]' : 'bg-[--color-muted] text-[--color-foreground-muted]'}`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Content per tab */}
      {tab === 'pending' && (
        <Section
          title="Awaiting Approval"
          icon={Clock}
          items={pending}
          iconColor="text-amber-600"
          emptyText="No items are currently pending approval. Great job!"
        />
      )}
      {tab === 'approved' && (
        <Section
          title="Approved"
          icon={CheckCircle2}
          items={approved}
          iconColor="text-emerald-600"
          emptyText="No approved items yet."
        />
      )}
      {tab === 'rejected' && (
        <Section
          title="Rejected / Cancelled"
          icon={XCircle}
          items={rejected}
          iconColor="text-red-500"
          emptyText="No rejected items."
        />
      )}
    </div>
  )
}

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tab = ['pending', 'approved', 'rejected'].includes(params.tab ?? '') ? (params.tab ?? 'pending') : 'pending'
  const companyId = await getCompanyId()

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Approvals</h1>
            <p className="text-xs text-[--color-foreground-muted]">
              Track RFQs, Quotations, and Purchase Orders by approval status
            </p>
          </div>
        </div>
      </div>
      <Suspense fallback={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        </div>
      }>
        <ApprovalsContent companyId={companyId} tab={tab} />
      </Suspense>
    </PageContainer>
  )
}
