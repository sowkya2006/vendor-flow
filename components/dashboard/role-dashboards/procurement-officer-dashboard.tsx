import { Suspense } from 'react'
import Link from 'next/link'
import { FileText, ShoppingCart, Plus, ArrowRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { Skeleton } from '@/components/shared/loading-states'
import { formatDate } from '@/lib/utils'
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

async function PODashboardContent() {
  try {
    const companyId = await getCompanyId()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const [draftRfqs, sentRfqs, draftPos, pendingPos, recentRfqs] = await Promise.all([
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'draft'),
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['sent', 'under_review']),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'draft'),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'pending_approval'),
    supabase.from('rfqs').select('id, rfq_number, title, status, priority, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(6),
  ])

  const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
    under_review: 'bg-violet-100 text-violet-700', awarded: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const PRIORITY_STYLE: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600', medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700', urgent: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[--color-foreground]">Procurement Officer</h1>
          <p className="text-xs text-[--color-foreground-muted] mt-0.5">Create RFQs and raise purchase orders for approval</p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/purchase-orders/new"><ShoppingCart className="h-3.5 w-3.5 mr-1.5" />New PO</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/rfqs/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New RFQ</Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Draft RFQs" value={draftRfqs.count ?? 0} sublabel="Not yet sent" accent={draftRfqs.count > 0 ? 'amber' : 'default'} href="/rfqs?status=draft" />
        <StatCard label="Active RFQs" value={sentRfqs.count ?? 0} sublabel="Sent to vendors" accent="blue" href="/rfqs?status=sent" />
        <StatCard label="Draft POs" value={draftPos.count ?? 0} sublabel="Not submitted" accent={draftPos.count > 0 ? 'amber' : 'default'} href="/purchase-orders?status=draft" />
        <StatCard label="POs Pending Approval" value={pendingPos.count ?? 0} sublabel="Awaiting sign-off" accent={pendingPos.count > 0 ? 'red' : 'default'} href="/purchase-orders?status=pending_approval" />
      </div>

      {/* Recent RFQs */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[--color-foreground-muted]" />
            <h2 className="text-sm font-semibold text-[--color-foreground]">Recent RFQs</h2>
          </div>
          <Link href="/rfqs" className="text-xs text-[--color-primary] hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {(recentRfqs.data ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-8 w-8 text-[--color-foreground-subtle] mb-2" />
            <p className="text-sm text-[--color-foreground-muted]">No RFQs yet</p>
            <Button asChild size="sm" className="mt-3"><Link href="/rfqs/new">Create your first RFQ</Link></Button>
          </div>
        ) : (
          <ul className="divide-y divide-[--color-border]">
            {(recentRfqs.data ?? []).map((rfq: { id: string; rfq_number: string; title: string; status: string; priority: string; created_at: string }) => (
              <li key={rfq.id}>
                <Link href={`/rfqs/${rfq.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[--color-background-subtle] transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[--color-foreground] truncate">{rfq.rfq_number}</p>
                    <p className="text-xs text-[--color-foreground-muted] truncate">{rfq.title}</p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLE[rfq.status] ?? 'bg-gray-100 text-gray-600')}>
                    {rfq.status.replace(/_/g, ' ')}
                  </span>
                  <span className={cn('hidden sm:inline shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', PRIORITY_STYLE[rfq.priority] ?? 'bg-gray-100 text-gray-600')}>
                    {rfq.priority}
                  </span>
                  <span className="hidden md:block text-xs text-[--color-foreground-muted] shrink-0">{formatDate(rfq.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Role guide */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
        <h2 className="mb-3 text-sm font-semibold text-[--color-foreground]">Your Responsibilities</h2>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          {[
            { icon: FileText, title: 'Create & Send RFQs', desc: 'Raise Requests for Quotation to vendors and track responses', href: '/rfqs' },
            { icon: ShoppingCart, title: 'Raise Purchase Orders', desc: 'Create POs from approved quotations and submit for manager approval', href: '/purchase-orders' },
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
        <p className="mt-3 text-[11px] text-[--color-foreground-subtle]">
          Note: Vendor and product management is handled by the Administrator.
        </p>
      </div>
    </div>
  )
  } catch (err) {
    console.error('[PODashboard]', err)
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-8 text-center">
          <p className="text-sm text-[--color-foreground-muted]">Unable to load dashboard. Please refresh.</p>
        </div>
      </div>
    )
  }
}

export function ProcurementOfficerDashboard() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    }>
      <PODashboardContent />
    </Suspense>
  )
}
