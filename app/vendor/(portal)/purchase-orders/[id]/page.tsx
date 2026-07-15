import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ShoppingCart, FileText, Receipt, AlertTriangle,
  CheckCircle2, Building2, Package, Calendar, CreditCard,
  Clock, XCircle, MessageSquare,
} from 'lucide-react'
import { getVendorUser } from '@/lib/supabase/vendor-portal'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, formatCurrency } from '@/lib/utils'
import { VendorPOActions } from '@/components/vendor-portal/vendor-po-actions'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Purchase Order' }

interface PageProps { params: Promise<{ id: string }> }

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  sent: 'bg-cyan-100 text-cyan-700',
  acknowledged: 'bg-teal-100 text-teal-700',
  in_progress: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const ACCEPTANCE_BADGE: Record<string, { cls: string; label: string }> = {
  pending:                 { cls: 'bg-amber-100 text-amber-700',   label: 'Awaiting Response' },
  accepted:                { cls: 'bg-emerald-100 text-emerald-700', label: 'Accepted' },
  rejected:                { cls: 'bg-red-100 text-red-700',       label: 'Rejected' },
  clarification_requested: { cls: 'bg-violet-100 text-violet-700', label: 'Clarification Requested' },
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[--color-border] last:border-0 last:pb-0 first:pt-0">
      <span className="text-xs text-[--color-foreground-muted] shrink-0">{label}</span>
      <span className="text-xs font-medium text-[--color-foreground] text-right">{value}</span>
    </div>
  )
}

export default async function VendorPoDetailPage({ params }: PageProps) {
  const { id } = await params

  // ── 1. Verify vendor session ──────────────────────────────────────────────
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')

  // ── 2. Fetch PO using service role (bypasses RLS) ────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  // Fetch with minimal safe columns first — avoid joins on columns that may
  // not exist if migrations haven't been run yet
  const { data: po, error: poErr } = await db
    .from('purchase_orders')
    .select(`
      id, po_number, status, total_amount,
      due_date, notes, created_at, updated_at,
      vendor_id, company_id,
      vendor:vendors(id, name, email, phone, address),
      company:companies(id, name, workspace_name),
      items:purchase_order_items(id, description, quantity, unit, unit_price, total_price)
    `)
    .eq('id', id)
    .maybeSingle()

  // If minimal query failed too — that's a real DB error
  if (poErr || !po) {
    console.error('[VendorPODetail] PO fetch failed:', poErr?.message, 'id:', id)
    notFound()
  }

  // Try to fetch optional columns added by migrations separately
  // These fail gracefully if the column doesn't exist yet
  let poExtended: {
    vendor_acceptance?: string | null
    vendor_rejection_reason?: string | null
    subtotal?: number | null
    tax_amount?: number | null
    discount_amount?: number | null
    payment_terms?: string | null
    shipping_address?: string | null
    approved_at?: string | null
    quotation?: { id: string; quotation_number: string; grand_total: number | null; status: string } | null
    rfq?: { id: string; rfq_number: string; title: string } | null
  } = {}

  try {
    const { data: ext } = await db
      .from('purchase_orders')
      .select(`
        vendor_acceptance, vendor_rejection_reason,
        subtotal, tax_amount, discount_amount,
        payment_terms, shipping_address, approved_at,
        rfq:rfqs(id, rfq_number, title),
        quotation:quotations(id, quotation_number, grand_total, status)
      `)
      .eq('id', id)
      .maybeSingle()
    if (ext) poExtended = ext
  } catch {
    // Optional columns not yet in schema — continue without them
  }

  // Merge base PO with extended fields
  const fullPO = { ...po, ...poExtended }

  // ── 4. Ownership verification ─────────────────────────────────────────────
  let isOwner = fullPO.vendor_id === vu.vendor_id

  if (!isOwner) {
    const { data: vc } = await db
      .from('vendor_companies').select('id')
      .eq('user_id', vu.user_id).maybeSingle()

    if (vc) {
      if (vc.id === fullPO.vendor_id) { isOwner = true }
      if (!isOwner) {
        const { data: vRow } = await db
          .from('vendors').select('id')
          .eq('vendor_company_id', vc.id).maybeSingle()
        if (vRow?.id === fullPO.vendor_id) isOwner = true
      }
    }

    if (!isOwner && vu.email) {
      const { data: vByEmail } = await db
        .from('vendors').select('id')
        .eq('id', fullPO.vendor_id).eq('email', vu.email).maybeSingle()
      if (vByEmail) isOwner = true
    }
  }

  // ── 5. Not owner → 403 (never 404 for auth errors) ───────────────────────
  if (!isOwner) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-5">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-[--color-foreground] mb-2">Access Denied</h1>
        <p className="text-sm text-[--color-foreground-muted] max-w-md mb-6">
          You do not have permission to view this Purchase Order.
          It may belong to a different vendor account.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/vendor/purchase-orders">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back to Purchase Orders
          </Link>
        </Button>
      </div>
    )
  }

  // ── 6. Derive state ───────────────────────────────────────────────────────
  const vendorAcceptance: string = fullPO.vendor_acceptance ?? 'pending'
  const acceptanceBadge = ACCEPTANCE_BADGE[vendorAcceptance] ?? { cls: 'bg-gray-100 text-gray-600', label: vendorAcceptance }
  const canRespond = (fullPO.status === 'sent' || fullPO.status === 'approved') && vendorAcceptance === 'pending'

  const items: Array<{
    id: string; description: string; quantity: number
    unit: string | null; unit_price: number; total_price: number | null
  }> = fullPO.items ?? []

  const subtotal = fullPO.subtotal ?? items.reduce((s: number, i) => s + (Number(i.total_price) || i.quantity * i.unit_price), 0)
  const taxAmount = fullPO.tax_amount ?? 0
  const grandTotal = fullPO.total_amount ?? (subtotal + taxAmount)

  // Check for completed GRN
  let hasCompletedGrn = false
  try {
    const { data: grn } = await db.from('grn').select('id')
      .eq('purchase_order_id', id).eq('status', 'completed').limit(1).maybeSingle()
    hasCompletedGrn = !!grn
  } catch { /* non-critical */ }

  return (
    <div className="p-6 max-w-5xl space-y-5">

      {/* Header */}
      <div>
        <Link href="/vendor/purchase-orders"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]">
          <ArrowLeft className="h-3.5 w-3.5" />Back to Purchase Orders
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-[--color-foreground]">{fullPO.po_number}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[fullPO.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {fullPO.status.replace(/_/g, ' ')}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${acceptanceBadge.cls}`}>
                {acceptanceBadge.label}
              </span>
            </div>
            <p className="text-xs text-[--color-foreground-muted] mt-0.5">
              Purchase Order · Created {formatDate(fullPO.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Required */}
      {canRespond && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">Action Required</p>
          <p className="text-xs text-amber-700 mb-3">This Purchase Order has been sent to you. Please respond.</p>
          <VendorPOActions poId={fullPO.id} />
        </div>
      )}
      {vendorAcceptance === 'accepted' && fullPO.status !== 'completed' && (
        hasCompletedGrn ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Goods received — ready to invoice</p>
                <p className="text-xs text-emerald-700 mt-0.5">A completed GRN exists. You may now create an invoice.</p>
              </div>
            </div>
            <Link href={`/vendor/invoices/new?po_id=${fullPO.id}`}>
              <Button size="sm" className="shrink-0 gap-1.5"><Receipt className="h-3.5 w-3.5" />Create Invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">PO Accepted — please dispatch goods</p>
              <p className="text-xs text-emerald-700 mt-0.5">Invoice can be created after the Warehouse Manager completes a GRN.</p>
            </div>
          </div>
        )
      )}
      {vendorAcceptance === 'rejected' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">You rejected this Purchase Order</p>
            {fullPO.vendor_rejection_reason && <p className="text-xs text-red-700 mt-0.5">Reason: {fullPO.vendor_rejection_reason}</p>}
          </div>
        </div>
      )}
      {vendorAcceptance === 'clarification_requested' && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-violet-800">Clarification requested</p>
            {fullPO.vendor_rejection_reason && <p className="text-xs text-violet-700 mt-0.5">{fullPO.vendor_rejection_reason}</p>}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
            <div className="border-b border-[--color-border] px-5 py-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-[--color-foreground-muted]" />
              <h2 className="text-sm font-semibold text-[--color-foreground]">Items {items.length > 0 && `(${items.length})`}</h2>
            </div>
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[--color-background-subtle]">
                    <tr>{['Description','Qty','Unit','Unit Price','Total'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[--color-foreground-muted]">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-[--color-border]">
                    {items.map((item) => {
                      const lineTotal = Number(item.total_price) || item.quantity * item.unit_price
                      return (
                        <tr key={item.id} className="hover:bg-[--color-background-subtle] transition-colors">
                          <td className="px-4 py-3 text-sm text-[--color-foreground]">{item.description}</td>
                          <td className="px-4 py-3 text-sm font-medium">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-[--color-foreground-muted]">{item.unit ?? '—'}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(lineTotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[--color-border] bg-[--color-background-subtle]">
                      <td colSpan={4} className="px-4 py-3 text-right text-xs font-bold text-[--color-foreground]">Order Total</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-[--color-foreground]">{formatCurrency(grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="px-5 py-8 text-center"><p className="text-sm text-[--color-foreground-muted]">No line items on this PO.</p></div>
            )}
          </div>
          {fullPO.notes && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h2 className="mb-2 text-sm font-semibold text-[--color-foreground] flex items-center gap-1.5"><FileText className="h-4 w-4 text-[--color-foreground-muted]" />Notes</h2>
              <p className="text-sm text-[--color-foreground-muted] whitespace-pre-wrap leading-relaxed">{fullPO.notes}</p>
            </div>
          )}
          {fullPO.shipping_address && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Shipping Address</h2>
              <p className="text-sm text-[--color-foreground-muted] whitespace-pre-wrap">{fullPO.shipping_address}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
            <h2 className="text-sm font-semibold text-[--color-foreground] mb-3">Order Details</h2>
            <Row label="PO Number" value={<span className="font-mono">{fullPO.po_number}</span>} />
            <Row label="Status" value={<span className="capitalize">{fullPO.status.replace(/_/g, ' ')}</span>} />
            <Row label="Your Response" value={<span className={`font-semibold ${vendorAcceptance==='accepted'?'text-emerald-600':vendorAcceptance==='rejected'?'text-red-600':vendorAcceptance==='pending'?'text-amber-600':'text-violet-600'}`}>{acceptanceBadge.label}</span>} />
            <Row label="Total" value={<span className="font-bold text-[--color-primary]">{formatCurrency(grandTotal)}</span>} />
            {fullPO.due_date && <Row label="Delivery Date" value={<span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{formatDate(fullPO.due_date)}</span>} />}
            {fullPO.payment_terms && <Row label="Payment Terms" value={<span className="flex items-center gap-1"><CreditCard className="h-3 w-3"/>{fullPO.payment_terms}</span>} />}
            <Row label="Created" value={<span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{formatDate(fullPO.created_at)}</span>} />
          </div>
          {fullPO.company && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <div className="flex items-center gap-2 mb-2"><Building2 className="h-4 w-4 text-[--color-foreground-muted]"/><h2 className="text-sm font-semibold text-[--color-foreground]">Issued By</h2></div>
              <p className="text-sm font-medium text-[--color-foreground]">{fullPO.company.workspace_name ?? fullPO.company.name}</p>
            </div>
          )}
          {fullPO.vendor && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <div className="flex items-center gap-2 mb-2"><Building2 className="h-4 w-4 text-[--color-foreground-muted]"/><h2 className="text-sm font-semibold text-[--color-foreground]">Vendor</h2></div>
              <p className="text-sm font-medium text-[--color-foreground]">{fullPO.vendor.name}</p>
              {fullPO.vendor.email && <p className="text-xs text-[--color-foreground-muted] mt-0.5">{fullPO.vendor.email}</p>}
            </div>
          )}
          {(fullPO.rfq || fullPO.quotation) && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm] space-y-3">
              <h2 className="text-sm font-semibold text-[--color-foreground]">Linked Documents</h2>
              {fullPO.rfq && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[--color-foreground-muted] mb-1">RFQ</p>
                  <Link href={`/vendor/rfqs/${fullPO.rfq.id}`} className="flex items-center gap-1.5 text-sm text-[--color-primary] hover:underline font-medium">
                    <FileText className="h-3.5 w-3.5 shrink-0"/>{fullPO.rfq.rfq_number}
                  </Link>
                  {fullPO.rfq.title && <p className="text-xs text-[--color-foreground-muted] mt-0.5 pl-5">{fullPO.rfq.title}</p>}
                </div>
              )}
              {fullPO.quotation && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[--color-foreground-muted] mb-1">Approved Quotation</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium font-mono text-[--color-foreground]">{fullPO.quotation.quotation_number}</span>
                    {fullPO.quotation.grand_total != null && <span className="text-xs font-semibold text-emerald-600">{formatCurrency(fullPO.quotation.grand_total)}</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
