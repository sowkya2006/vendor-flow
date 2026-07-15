import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText, ShoppingCart, FileSearch, Building2, ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Procurement Overview — VendorFlow' }

export default async function ProcurementPage() {
  const [companyId, role] = await Promise.all([getCompanyId(), getUserRole()])

  // Only procurement roles + admin can see this page
  if (!['administrator', 'admin', 'procurement_manager', 'procurement_officer'].includes(role)) {
    redirect('/dashboard')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const [rfqStats, quotationStats, poStats, vendorCount] = await Promise.all([
    supabase.from('rfqs').select('status').eq('company_id', companyId),
    supabase.from('quotations').select('status, grand_total').eq('company_id', companyId),
    supabase.from('purchase_orders').select('status, total_amount').eq('company_id', companyId),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
  ])

  const rfqs = rfqStats.data ?? []
  const quotations = quotationStats.data ?? []
  const pos = poStats.data ?? []

  const totalSpend = pos
    .filter((p: { status: string }) => ['completed', 'approved', 'sent', 'acknowledged'].includes(p.status))
    .reduce((s: number, p: { total_amount: number | null }) => s + (p.total_amount ?? 0), 0)

  const stats = [
    {
      label: 'Active RFQs',
      value: rfqs.filter((r: { status: string }) => ['draft', 'sent', 'under_review'].includes(r.status)).length,
      sub: `${rfqs.filter((r: { status: string }) => r.status === 'awarded').length} awarded`,
      icon: FileText,
      href: '/rfqs',
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
    },
    {
      label: 'Quotations',
      value: quotations.filter((q: { status: string }) => q.status === 'submitted').length,
      sub: 'pending review',
      icon: FileSearch,
      href: '/quotations',
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Purchase Orders',
      value: pos.filter((p: { status: string }) => p.status === 'pending_approval').length,
      sub: 'awaiting approval',
      icon: ShoppingCart,
      href: '/purchase-orders',
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Active Vendors',
      value: vendorCount.count ?? 0,
      sub: 'in network',
      icon: Building2,
      href: '/vendors',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
  ]

  const workflow = [
    { step: 1, label: 'Create RFQ', desc: 'Procurement Officer raises a Request for Quotation', href: '/rfqs/new', role: 'Procurement Officer', done: rfqs.length > 0 },
    { step: 2, label: 'Vendor Submits Quote', desc: 'Vendor responds via Vendor Portal', href: '/quotations', role: 'Vendor', done: quotations.length > 0 },
    { step: 3, label: 'Approve Quotation', desc: 'Procurement Manager reviews and awards best quote', href: '/quotations', role: 'Procurement Manager', done: quotations.some((q: { status: string }) => q.status === 'approved') },
    { step: 4, label: 'Create Purchase Order', desc: 'Officer creates PO from approved quotation', href: '/purchase-orders/new', role: 'Procurement Officer', done: pos.length > 0 },
    { step: 5, label: 'Approve PO', desc: 'Manager approves PO before sending to vendor', href: '/approvals/pending', role: 'Procurement Manager', done: pos.some((p: { status: string }) => ['approved', 'sent', 'completed'].includes(p.status)) },
    { step: 6, label: 'Receive Goods', desc: 'Warehouse Manager creates GRN on delivery', href: '/inventory/grn', role: 'Warehouse Manager', done: false },
    { step: 7, label: 'Pay Invoice', desc: 'Finance Manager approves and records payment', href: '/payments/invoices', role: 'Finance Manager', done: false },
  ]

  return (
    <>
      <WorkspaceHeader
        title="Procurement Overview"
        description="Monitor the complete procurement cycle from RFQ to payment."
      />
      <PageContainer>
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Link key={stat.label} href={stat.href} className="rounded-xl border border-[--color-border] bg-[--color-card] p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg} ${stat.color} mb-3`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold text-[--color-foreground]">{stat.value}</p>
                  <p className="text-xs font-medium text-[--color-foreground]">{stat.label}</p>
                  <p className="text-[11px] text-[--color-foreground-muted]">{stat.sub}</p>
                </Link>
              )
            })}
          </div>

          {/* Total spend */}
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[var(--shadow-sm)]">
            <p className="text-xs font-medium text-[--color-foreground-muted]">Total Procurement Spend</p>
            <p className="mt-1 text-3xl font-bold text-[--color-primary]">{formatCurrency(totalSpend)}</p>
            <p className="text-xs text-[--color-foreground-subtle]">Across approved and completed purchase orders</p>
          </div>

          {/* Workflow pipeline */}
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="border-b border-[--color-border] px-5 py-4">
              <h2 className="text-sm font-semibold text-[--color-foreground]">Procurement Workflow</h2>
              <p className="text-xs text-[--color-foreground-muted] mt-0.5">End-to-end procurement pipeline</p>
            </div>
            <div className="divide-y divide-[--color-border]">
              {workflow.map((step) => (
                <Link key={step.step} href={step.href} className="flex items-start gap-4 px-5 py-4 hover:bg-[--color-background-subtle] transition-colors group">
                  {/* Step number / check */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step.done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-[--color-background-muted] text-[--color-foreground-muted]'}`}>
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : step.step}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[--color-foreground]">{step.label}</p>
                      <span className="rounded-full bg-[--color-background-subtle] border border-[--color-border] px-2 py-0.5 text-[10px] font-medium text-[--color-foreground-muted]">
                        {step.role}
                      </span>
                    </div>
                    <p className="text-xs text-[--color-foreground-muted] mt-0.5">{step.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[--color-foreground-subtle] shrink-0 mt-1 group-hover:text-[--color-primary] transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Create RFQ', desc: 'Start a new procurement request', href: '/rfqs/new', icon: FileText },
              { label: 'Review Quotations', desc: 'Compare and award vendor quotes', href: '/quotations?status=submitted', icon: FileSearch },
              { label: 'Pending Approvals', desc: 'Review items awaiting your sign-off', href: '/approvals/pending', icon: Clock },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.label} href={action.href} className="flex items-center gap-3 rounded-xl border border-[--color-border] bg-[--color-card] px-4 py-3.5 hover:border-[--color-primary]/30 hover:bg-[--color-primary]/5 transition-all shadow-[var(--shadow-sm)] group">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[--color-foreground]">{action.label}</p>
                    <p className="text-[11px] text-[--color-foreground-muted]">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[--color-foreground-subtle] ml-auto shrink-0 group-hover:text-[--color-primary] transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      </PageContainer>
    </>
  )
}
