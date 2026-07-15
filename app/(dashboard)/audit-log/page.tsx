/**
 * Audit Log — System Activity History
 *
 * Shows all important actions across every module using live DB data.
 * Replaces the old workflow-based audit log with a comprehensive activity feed
 * built from notifications + direct entity queries.
 */
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ShieldCheck, FileText, ShoppingCart, FileSearch, ClipboardList, CreditCard, Building2, Users, Package, Bell } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { Skeleton } from '@/components/shared/loading-states'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Audit Log — VendorFlow' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ module?: string; page?: string }>
}

// ── Activity item shape ───────────────────────────────────────────────────────
interface ActivityItem {
  id: string
  timestamp: string
  module: string
  action: string
  entity_ref: string
  entity_link: string
  status: string | null
  actor: string | null
  amount: number | null
}

const MODULE_ICON: Record<string, React.ElementType> = {
  RFQ: FileText,
  Quotation: FileSearch,
  'Purchase Order': ShoppingCart,
  GRN: ClipboardList,
  Invoice: CreditCard,
  Payment: CreditCard,
  Vendor: Building2,
  Employee: Users,
  Product: Package,
  Notification: Bell,
  System: ShieldCheck,
}

const MODULE_COLOR: Record<string, string> = {
  RFQ:              'bg-blue-100 text-blue-700',
  Quotation:        'bg-purple-100 text-purple-700',
  'Purchase Order': 'bg-orange-100 text-orange-700',
  GRN:              'bg-teal-100 text-teal-700',
  Invoice:          'bg-indigo-100 text-indigo-700',
  Payment:          'bg-emerald-100 text-emerald-700',
  Vendor:           'bg-cyan-100 text-cyan-700',
  Employee:         'bg-pink-100 text-pink-700',
  Product:          'bg-amber-100 text-amber-700',
  System:           'bg-gray-100 text-gray-700',
}

const STATUS_PILL: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  sent: 'bg-cyan-100 text-cyan-700',
  paid: 'bg-green-100 text-green-700',
  submitted: 'bg-amber-100 text-amber-700',
  active: 'bg-emerald-100 text-emerald-700',
}

// ── Fetch all audit-relevant activity ────────────────────────────────────────

async function fetchAuditItems(companyId: string): Promise<ActivityItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const items: ActivityItem[] = []
  const LIMIT = 500

  await Promise.allSettled([
    // RFQs
    supabase.from('rfqs').select('id, rfq_number, title, status, created_at, updated_at, created_by:users(full_name, email)')
      .eq('company_id', companyId).order('updated_at', { ascending: false }).limit(LIMIT)
      .then(({ data }: { data: Array<{ id: string; rfq_number: string; title: string; status: string; created_at: string; updated_at: string; created_by: { full_name: string | null; email: string } | null }> | null }) => {
        for (const r of data ?? []) {
          const actor = r.created_by?.full_name ?? r.created_by?.email ?? 'System'
          items.push({ id: `rfq-${r.id}`, timestamp: r.updated_at ?? r.created_at, module: 'RFQ', action: r.status === 'draft' ? 'Created' : `Status → ${r.status.replace(/_/g, ' ')}`, entity_ref: r.rfq_number, entity_link: `/rfqs/${r.id}`, status: r.status, actor, amount: null })
        }
      }),

    // Quotations
    supabase.from('quotations').select('id, quotation_number, status, grand_total, created_at, updated_at, vendor:vendors(name)')
      .eq('company_id', companyId).order('updated_at', { ascending: false }).limit(LIMIT)
      .then(({ data }: { data: Array<{ id: string; quotation_number: string; status: string; grand_total: number | null; created_at: string; updated_at: string; vendor: { name: string } | null }> | null }) => {
        for (const r of data ?? []) {
          items.push({ id: `quot-${r.id}`, timestamp: r.updated_at ?? r.created_at, module: 'Quotation', action: `${r.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}`, entity_ref: r.quotation_number, entity_link: `/quotations/${r.id}`, status: r.status, actor: r.vendor?.name ?? null, amount: r.grand_total })
        }
      }),

    // Purchase Orders
    supabase.from('purchase_orders').select('id, po_number, status, total_amount, created_at, updated_at, vendor:vendors(name)')
      .eq('company_id', companyId).order('updated_at', { ascending: false }).limit(LIMIT)
      .then(({ data }: { data: Array<{ id: string; po_number: string; status: string; total_amount: number | null; created_at: string; updated_at: string; vendor: { name: string } | null }> | null }) => {
        for (const r of data ?? []) {
          items.push({ id: `po-${r.id}`, timestamp: r.updated_at ?? r.created_at, module: 'Purchase Order', action: `Status → ${r.status.replace(/_/g, ' ')}`, entity_ref: r.po_number, entity_link: `/purchase-orders/${r.id}`, status: r.status, actor: r.vendor?.name ?? null, amount: r.total_amount })
        }
      }),

    // GRNs
    supabase.from('grn').select('id, grn_number, status, created_at, updated_at, warehouse:warehouses(name)')
      .eq('company_id', companyId).order('updated_at', { ascending: false }).limit(LIMIT)
      .then(({ data }: { data: Array<{ id: string; grn_number: string; status: string; created_at: string; updated_at: string; warehouse: { name: string } | null }> | null }) => {
        for (const r of data ?? []) {
          items.push({ id: `grn-${r.id}`, timestamp: r.updated_at ?? r.created_at, module: 'GRN', action: `${r.status === 'draft' ? 'Created' : `Status → ${r.status}`}`, entity_ref: r.grn_number, entity_link: `/inventory/grn/${r.id}`, status: r.status, actor: r.warehouse?.name ?? null, amount: null })
        }
      }),

    // Invoices
    supabase.from('invoices').select('id, invoice_number, status, total_amount, created_at, updated_at, vendor:vendors(name)')
      .eq('company_id', companyId).order('updated_at', { ascending: false }).limit(LIMIT)
      .then(({ data }: { data: Array<{ id: string; invoice_number: string; status: string; total_amount: number | null; created_at: string; updated_at: string; vendor: { name: string } | null }> | null }) => {
        for (const r of data ?? []) {
          items.push({ id: `inv-${r.id}`, timestamp: r.updated_at ?? r.created_at, module: 'Invoice', action: `Status → ${r.status.replace(/_/g, ' ')}`, entity_ref: r.invoice_number, entity_link: `/payments/invoices/${r.id}`, status: r.status, actor: r.vendor?.name ?? null, amount: r.total_amount })
        }
      }),

    // Payments
    supabase.from('payments').select('id, payment_reference, amount, payment_date, created_at, vendor:vendors(name)')
      .eq('company_id', companyId).order('created_at', { ascending: false }).limit(LIMIT)
      .then(({ data }: { data: Array<{ id: string; payment_reference: string; amount: number; payment_date: string; created_at: string; vendor: { name: string } | null }> | null }) => {
        for (const r of data ?? []) {
          items.push({ id: `pay-${r.id}`, timestamp: r.created_at, module: 'Payment', action: 'Payment Recorded', entity_ref: r.payment_reference, entity_link: `/payments/history`, status: 'completed', actor: r.vendor?.name ?? null, amount: r.amount })
        }
      }),

    // Vendors
    supabase.from('vendors').select('id, name, status, created_at, updated_at')
      .eq('company_id', companyId).order('updated_at', { ascending: false }).limit(100)
      .then(({ data }: { data: Array<{ id: string; name: string; status: string; created_at: string; updated_at: string }> | null }) => {
        for (const r of data ?? []) {
          items.push({ id: `vendor-${r.id}`, timestamp: r.updated_at ?? r.created_at, module: 'Vendor', action: `Vendor ${r.status === 'active' ? 'Approved' : r.status === 'pending' ? 'Registered' : r.status}`, entity_ref: r.name, entity_link: `/vendors/${r.id}`, status: r.status, actor: null, amount: null })
        }
      }),

    // Products (if any)
    supabase.from('products').select('id, name, sku, status, created_at, updated_at')
      .eq('company_id', companyId).order('created_at', { ascending: false }).limit(100)
      .then(({ data }: { data: Array<{ id: string; name: string; sku: string; status: string; created_at: string; updated_at: string }> | null }) => {
        for (const r of data ?? []) {
          items.push({ id: `prod-${r.id}`, timestamp: r.created_at, module: 'Product', action: 'Product Created', entity_ref: `${r.name} (${r.sku})`, entity_link: `/products/${r.id}`, status: r.status, actor: null, amount: null })
        }
      }),
  ])

  // Sort by timestamp descending, deduplicate by id
  const seen = new Set<string>()
  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true })
}

// ── Components ───────────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = MODULE_ICON[item.module] ?? ShieldCheck
  const modColor = MODULE_COLOR[item.module] ?? 'bg-gray-100 text-gray-700'
  const statusCls = item.status ? (STATUS_PILL[item.status] ?? 'bg-gray-100 text-gray-600') : ''

  return (
    <div className="flex items-start gap-4 px-5 py-3.5 hover:bg-[--color-background-subtle] transition-colors">
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5', modColor)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-[--color-foreground]">{item.action}</span>
          <a href={item.entity_link} className="text-sm text-[--color-primary] hover:underline font-medium">
            {item.entity_ref}
          </a>
          {item.actor && (
            <span className="text-xs text-[--color-foreground-muted]">· {item.actor}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', modColor)}>
            {item.module}
          </span>
          {item.status && (
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize', statusCls)}>
              {item.status.replace(/_/g, ' ')}
            </span>
          )}
          {item.amount != null && item.amount > 0 && (
            <span className="text-xs text-[--color-foreground-muted]">
              ₹{item.amount.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-[--color-foreground-muted] whitespace-nowrap">
          {formatDate(item.timestamp)}
        </p>
      </div>
    </div>
  )
}

const MODULES = ['All', 'RFQ', 'Quotation', 'Purchase Order', 'GRN', 'Invoice', 'Payment', 'Vendor', 'Product']

async function AuditContent({ companyId, module: filterModule }: { companyId: string; module: string }) {
  const allItems = await fetchAuditItems(companyId)
  const filtered = filterModule === 'All' || !filterModule
    ? allItems
    : allItems.filter((i) => i.module === filterModule)

  return (
    <div className="space-y-4">
      {/* Module filter tabs */}
      <div className="flex flex-wrap gap-2">
        {MODULES.map((m) => {
          const count = m === 'All' ? allItems.length : allItems.filter((i) => i.module === m).length
          const active = (filterModule === m) || (m === 'All' && (!filterModule || filterModule === 'All'))
          return (
            <a
              key={m}
              href={`/audit-log?module=${m}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'bg-[--color-primary] text-white'
                  : 'bg-[--color-background-subtle] text-[--color-foreground-muted] hover:bg-[--color-muted] border border-[--color-border]',
              )}
            >
              {m}
              <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-bold', active ? 'bg-white/20 text-white' : 'bg-[--color-muted] text-[--color-foreground-muted]')}>
                {count}
              </span>
            </a>
          )
        })}
      </div>

      {/* Activity feed */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-[--color-foreground-subtle] mb-3" />
            <p className="text-sm font-medium text-[--color-foreground]">No activity yet</p>
            <p className="text-xs text-[--color-foreground-muted] mt-1">Actions in this module will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-[--color-border]">
            {filtered.slice(0, 200).map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
            {filtered.length > 200 && (
              <div className="px-5 py-3 text-center text-xs text-[--color-foreground-muted]">
                Showing 200 of {filtered.length} records
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AuditLogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filterModule = params.module ?? 'All'
  const companyId = await getCompanyId()

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Audit Log"
        description="Complete system activity history across all modules"
      />
      <PageContainer>
        <Suspense fallback={
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}</div>
            <div className="space-y-px">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-none first:rounded-t-xl last:rounded-b-xl" />)}</div>
          </div>
        }>
          <AuditContent companyId={companyId} module={filterModule} />
        </Suspense>
      </PageContainer>
    </div>
  )
}
