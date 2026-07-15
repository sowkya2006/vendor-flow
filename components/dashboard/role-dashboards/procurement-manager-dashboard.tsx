import { Suspense } from 'react'
import Link from 'next/link'
import { FileSearch, ShoppingCart, CheckCircle2, ArrowRight, Plus, Clock, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function StatCard({ label, value, sublabel, accent = 'default', href }: {
  label: string; value: number | string; sublabel?: string
  accent?: 'default' | 'blue' | 'amber' | 'green' | 'red'; href?: string
}) {
  const colors: Record<string, string> = {
    default: 'text-[--color-primary]', blue: 'text-blue-600',
    amber: 'text-amber-600', green: 'text-emerald-600', red: 'text-red-600',
  }
  const card = (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
      <p className="text-xs font-medium text-[--color-foreground-muted]">{label}</p>
      <p className={cn('mt-1 text-3xl font-bold', colors[accent])}>{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-[--color-foreground-muted]">{sublabel}</p>}
    </div>
  )
  return href ? <Link href={href} className="block transition-shadow hover:shadow-[--shadow-md]">{card}</Link> : card
}

async function PMDashboardContent() {
  try {
    const companyId = await getCompanyId()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any

    // For pending approvals in preview mode, query by company not by user
    // since the admin's user.id won't have approval steps assigned to them
    const [submittedQuotations, pendingPos, approvedPos, spend, pendingApprovalsResult, recentPos] = await Promise.all([
      supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'submitted'),
      supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending_approval'),
      supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'approved'),
      supabase.from('payments').select('amount').eq('company_id', companyId).gte('payment_date', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
      // Query ALL pending approvals for this company (not filtered by user in preview)
      supabase.from('approval_requests').select('id, title, entity_type, entity_ref, priority, created_at, status').eq('company_id', companyId).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      supabase.from('purchase_orders').select('id, po_number, status, total_amount, created_at, vendor:vendors(name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
    ])

    const pendingApprovals = { data: pendingApprovalsResult.data ?? [], total: pendingApprovalsResult.count ?? (pendingApprovalsResult.data ?? []).length }
    const monthlySpend = (spend.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)

  const PO_STATUS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending_approval: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    sent: 'bg-cyan-100 text-cyan-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[--color-foreground]">Procurement Manager</h1>
          <p className="text-xs text-[--color-foreground-muted] mt-0.5">Review quotations, approve purchase orders and manage procurement budgets</p>
        </div>
        <Button asChild size="sm">
          <Link href="/purchase-orders/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New PO</Link>
        </Button>
      </div>

      {/* KPIs — focused on approvals and POs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Quotations to Review" value={submittedQuotations.count ?? 0} sublabel="Submitted by vendors" accent={submittedQuotations.count > 0 ? 'amber' : 'default'} href="/quotations?status=submitted" />
        <StatCard label="POs Awaiting Approval" value={pendingPos.count ?? 0} sublabel="Need your sign-off" accent={pendingPos.count > 0 ? 'red' : 'default'} href="/purchase-orders?status=pending_approval" />
        <StatCard label="Approved POs" value={approvedPos.count ?? 0} sublabel="Ready to send" accent="green" href="/purchase-orders?status=approved" />
        <StatCard label="Monthly Spend" value={formatCurrency(monthlySpend)} sublabel="Last 30 days" accent="blue" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Pending approvals — primary focus */}
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-[--color-foreground]">Pending Your Approval</h2>
              {pendingApprovals.total > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{pendingApprovals.total}</span>
              )}
            </div>
            <Link href="/approvals/pending" className="text-xs text-[--color-primary] hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {pendingApprovals.data.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
              <p className="text-sm font-medium text-emerald-600">All caught up!</p>
              <p className="text-xs text-[--color-foreground-muted] mt-0.5">No pending approvals.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[--color-border]">
              {(pendingApprovals.data ?? []).map((item: { id: string; title: string; entity_type: string; entity_ref: string; priority: string; created_at: string }) => (
                <li key={item.id}>
                  <Link href={`/approvals/${item.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-[--color-background-subtle] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[--color-foreground] truncate">{item.title ?? item.entity_ref}</p>
                      <p className="text-xs text-[--color-foreground-muted]">{item.entity_type.replace(/_/g, ' ')} · {formatDate(item.created_at)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 capitalize">{item.priority}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent POs */}
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[--color-foreground-muted]" />
              <h2 className="text-sm font-semibold text-[--color-foreground]">Recent Purchase Orders</h2>
            </div>
            <Link href="/purchase-orders" className="text-xs text-[--color-primary] hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {(recentPos.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <ShoppingCart className="h-8 w-8 text-[--color-foreground-subtle] mb-2" />
              <p className="text-sm text-[--color-foreground-muted] mb-2">No POs yet</p>
              <Button asChild size="sm" variant="outline"><Link href="/purchase-orders/new">Create first PO</Link></Button>
            </div>
          ) : (
            <ul className="divide-y divide-[--color-border]">
              {(recentPos.data ?? []).map((po: { id: string; po_number: string; status: string; total_amount: number | null; created_at: string; vendor: { name: string } | null }) => (
                <li key={po.id}>
                  <Link href={`/purchase-orders/${po.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-[--color-background-subtle] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[--color-foreground]">{po.po_number}</p>
                      <p className="text-xs text-[--color-foreground-muted]">{po.vendor?.name ?? '—'}</p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', PO_STATUS[po.status] ?? 'bg-gray-100 text-gray-600')}>{po.status.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-semibold text-[--color-foreground] shrink-0">{po.total_amount != null ? formatCurrency(po.total_amount) : '—'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Role guide */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
        <h2 className="mb-3 text-sm font-semibold text-[--color-foreground]">Your Responsibilities</h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          {[
            { icon: FileSearch, title: 'Review Quotations', desc: 'Compare vendor quotations and select the best offer', href: '/quotations' },
            { icon: ShoppingCart, title: 'Purchase Orders', desc: 'Create POs based on approved quotations and manage delivery', href: '/purchase-orders' },
            { icon: CheckCircle2, title: 'Approve Requests', desc: 'Review and approve POs, RFQ awards and procurement decisions', href: '/approvals/pending' },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="group flex gap-3 rounded-xl border border-[--color-border] bg-[--color-background-subtle] p-4 hover:border-[--color-primary]/30 hover:bg-[--color-primary]/5 transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[--color-foreground]">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-[--color-foreground-muted] leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
  } catch (err) {
    console.error('[PMDashboard] Error:', err)
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-8 text-center">
          <p className="text-sm text-[--color-foreground-muted]">
            Unable to load dashboard data. Please refresh the page.
          </p>
        </div>
      </div>
    )
  }
}

export function ProcurementManagerDashboard() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
      </div>
    }>
      <PMDashboardContent />
    </Suspense>
  )
}
