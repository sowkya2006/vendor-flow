import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Receipt, AlertTriangle, CheckCircle2, ShoppingCart, Clock } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getVendorUser } from '@/lib/supabase/vendor-portal'
import { createAdminClient } from '@/lib/supabase/admin'
import { VendorInvoiceForm } from '@/components/vendor-portal/vendor-invoice-form'
import { createVendorInvoiceAction } from '@/app/vendor/actions'
import type { POForInvoice } from '@/lib/supabase/vendor-portal'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Create Invoice' }

interface PageProps {
  searchParams: Promise<{ po_id?: string }>
}

export default async function NewVendorInvoicePage({ searchParams }: PageProps) {
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')

  const { po_id } = await searchParams

  // Fetch all eligible POs for this vendor using admin client
  // This bypasses vendor_id mismatches that affect self-registered vendors
  const allPOs = await fetchAllVendorPOs(vu)

  // If a specific PO is requested, use the direct fetch for full data
  let selectedPO: POForInvoice | null = null
  if (po_id) {
    selectedPO = await fetchPOForInvoiceDirect(po_id)
    // Fallback: find in allPOs list
    if (!selectedPO) selectedPO = allPOs.find((p) => p.id === po_id) ?? null
  }

  // Auto-select: if no po_id and exactly one eligible PO exists, show form directly
  if (!selectedPO && !po_id) {
    const eligible = allPOs.filter((p) => p.vendor_acceptance === 'accepted')
    if (eligible.length === 1) {
      // Fetch with full data
      selectedPO = await fetchPOForInvoiceDirect(eligible[0].id)
    } else if (eligible.length > 1) {
      // Multiple POs — prefer the one with a completed GRN
      const withGrn = eligible.filter((p) => p.completed_grn !== null)
      if (withGrn.length === 1) {
        selectedPO = await fetchPOForInvoiceDirect(withGrn[0].id)
      }
    }
  }

  const posAwaitingAcceptance = allPOs.filter(
    (p) => !p.vendor_acceptance || p.vendor_acceptance === 'pending'
  )
  const posWithGrn = allPOs.filter((p) => p.completed_grn !== null && p.vendor_acceptance === 'accepted')
  const posWithoutGrn = allPOs.filter((p) => p.completed_grn === null && p.vendor_acceptance === 'accepted')

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div>
        <Link
          href="/vendor/invoices"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Invoices
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Create Invoice</h1>
            <p className="text-xs text-[--color-foreground-muted]">
              Invoice details are auto-filled from the Purchase Order and GRN
            </p>
          </div>
        </div>
      </div>

      {/* No POs at all */}
      {allPOs.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <p className="text-sm font-semibold text-amber-800">No Purchase Orders found</p>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            Invoices can only be created after a Purchase Order has been issued to you.
            Please check back once your company partner shares a PO.
          </p>
          <Link
            href="/vendor/purchase-orders"
            className="inline-block mt-2 rounded-lg border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-medium text-amber-800 hover:bg-amber-200 transition-colors"
          >
            View Purchase Orders
          </Link>
        </div>
      )}

      {/* Has POs but selected one is ready — show form */}
      {selectedPO && (
        <VendorInvoiceForm po={selectedPO} onSubmit={createVendorInvoiceAction} />
      )}

      {/* PO list when no PO is selected yet */}
      {allPOs.length > 0 && !selectedPO && (
        <div className="space-y-4">

          {/* Step 1: POs awaiting your acceptance */}
          {posAwaitingAcceptance.length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[--color-border] px-5 py-3 bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-amber-800">
                  Step 1 — Accept these Purchase Orders first ({posAwaitingAcceptance.length})
                </h2>
              </div>
              <div className="divide-y divide-[--color-border]">
                {posAwaitingAcceptance.map((po) => (
                  <Link
                    key={po.id}
                    href={`/vendor/purchase-orders/${po.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[--color-background-subtle] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[--color-foreground]">{po.po_number}</p>
                      <div className="flex items-center gap-3 text-xs text-[--color-foreground-muted] mt-0.5">
                        <span className="capitalize">{po.status.replace(/_/g, ' ')}</span>
                        <span>{po.items.length} item{po.items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {po.total_amount != null && (
                        <p className="text-sm font-bold text-[--color-foreground]">
                          ₹{po.total_amount.toLocaleString('en-IN')}
                        </p>
                      )}
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                        Accept PO →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="border-t border-[--color-border] px-5 py-3 bg-amber-50/60">
                <p className="text-xs text-amber-700">
                  Go to the Purchase Order page and click <strong>Accept</strong> before you can create an invoice.
                </p>
              </div>
            </div>
          )}

          {/* POs accepted, with GRN — ready to invoice */}
          {posWithGrn.length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[--color-border] px-5 py-3 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-emerald-800">
                  Ready to Invoice — GRN Completed ({posWithGrn.length})
                </h2>
              </div>
              <div className="divide-y divide-[--color-border]">
                {posWithGrn.map((po) => (
                  <Link
                    key={po.id}
                    href={`/vendor/invoices/new?po_id=${po.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[--color-background-subtle] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[--color-foreground]">{po.po_number}</p>
                      <div className="flex items-center gap-3 text-xs text-[--color-foreground-muted] mt-0.5">
                        <span>GRN: {po.completed_grn!.grn_number}</span>
                        <span>{po.items.length} item{po.items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[--color-foreground]">
                        {po.total_amount != null ? `₹${po.total_amount.toLocaleString('en-IN')}` : '—'}
                      </p>
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                        Create Invoice →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* POs accepted but awaiting GRN */}
          {posWithoutGrn.length > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[--color-border] px-5 py-3 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-amber-800">
                  Awaiting Goods Receipt — Cannot Invoice Yet ({posWithoutGrn.length})
                </h2>
              </div>
              <div className="divide-y divide-[--color-border]">
                {posWithoutGrn.map((po) => (
                  <div key={po.id} className="flex items-center justify-between gap-4 px-5 py-4 opacity-60">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[--color-foreground]">{po.po_number}</p>
                      <p className="text-xs text-[--color-foreground-muted] mt-0.5">
                        PO Accepted · Awaiting Goods Receipt Note from Warehouse
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 shrink-0">
                      Awaiting GRN
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[--color-border] px-5 py-3 bg-amber-50/50">
                <p className="text-xs text-amber-700">
                  The Warehouse Manager must complete a Goods Receipt Note (GRN) after receiving
                  the goods before you can create an invoice.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch all POs for a vendor using admin client — bypasses RLS and vendor_id
// mismatches. Returns lightweight list (no GRN items) for the selection UI.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAllVendorPOs(vu: { vendor_id: string; user_id?: string | null; email?: string | null }): Promise<POForInvoice[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Collect all possible vendor IDs for this user
    const { data: linkedVendors } = await admin
      .from('vendors')
      .select('id')
      .or(`id.eq.${vu.vendor_id},vendor_company_id.eq.${vu.vendor_id}`)
      .limit(10)

    // Also try by email
    const { data: vendorByEmail } = (vu.email)
      ? await admin.from('vendors').select('id').eq('email', vu.email).limit(5)
      : { data: null as null }

    const vendorIds = [
      vu.vendor_id,
      ...((linkedVendors ?? []) as { id: string }[]).map((v) => v.id),
      ...((vendorByEmail ?? []) as { id: string }[]).map((v) => v.id),
    ]
    const uniqueIds = [...new Set(vendorIds.filter(Boolean))]

    const { data: pos } = await admin
      .from('purchase_orders')
      .select(`
        id, po_number, total_amount, vendor_id, company_id, status, vendor_acceptance,
        vendor:vendors(name, email),
        items:purchase_order_items(id, description, quantity, unit, unit_price)
      `)
      .in('vendor_id', uniqueIds)
      .in('status', ['approved', 'sent', 'acknowledged', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (!pos || pos.length === 0) return []

    const poIds = (pos as { id: string }[]).map((p) => p.id)

    // Get completed GRNs for these POs
    const { data: grns } = await admin
      .from('grn')
      .select('id, grn_number, received_date, purchase_order_id')
      .in('purchase_order_id', poIds)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    const grnByPO = new Map<string, { id: string; grn_number: string; received_date: string }>()
    for (const grn of (grns ?? []) as { id: string; grn_number: string; received_date: string; purchase_order_id: string }[]) {
      if (!grnByPO.has(grn.purchase_order_id)) grnByPO.set(grn.purchase_order_id, grn)
    }

    return (pos as POForInvoice[]).map((po) => ({
      ...po,
      items: po.items ?? [],
      completed_grn: (() => {
        const g = grnByPO.get(po.id)
        return g ? { id: g.id, grn_number: g.grn_number, received_date: g.received_date, grn_items: [] } : null
      })(),
    }))
  } catch (e) {
    console.error('[fetchAllVendorPOs] error:', e)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct admin fetch — fetches PO with full items + GRN items.
// This is the authoritative source for invoice auto-fill data.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchPOForInvoiceDirect(poId: string): Promise<POForInvoice | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Fetch PO with vendor, company, and line items
    const { data: po, error: poErr } = await admin
      .from('purchase_orders')
      .select(`
        id, po_number, total_amount, vendor_id, company_id, status, vendor_acceptance,
        vendor:vendors(name, email),
        items:purchase_order_items(id, description, quantity, unit, unit_price)
      `)
      .eq('id', poId)
      .maybeSingle()

    if (poErr || !po) {
      console.error('[fetchPOForInvoiceDirect] PO fetch error:', poErr?.message)
      return null
    }

    // Fetch the most recent completed GRN for this PO
    const { data: grn } = await admin
      .from('grn')
      .select('id, grn_number, received_date, purchase_order_id')
      .eq('purchase_order_id', poId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Fetch GRN items if a completed GRN exists
    let grnItems: POForInvoice['completed_grn'] extends null ? never : NonNullable<POForInvoice['completed_grn']>['grn_items'] = []
    if (grn) {
      // Try extended columns first (post-migration)
      const { data: extItems, error: extErr } = await admin
        .from('grn_items')
        .select('id, grn_id, product_id, item_name, description, ordered_quantity, received_quantity, accepted_quantity, unit, unit_cost, notes, tax_percentage')
        .eq('grn_id', grn.id)

      if (!extErr && extItems && extItems.length > 0) {
        grnItems = extItems.map((gi: {
          id: string; grn_id: string; product_id: string | null
          item_name: string | null; description: string | null
          ordered_quantity: number; received_quantity: number; accepted_quantity: number | null
          unit: string | null; unit_cost: number; notes: string | null; tax_percentage: number | null
        }) => ({
          id: gi.id,
          item_name: gi.item_name ?? gi.description ?? gi.notes ?? null,
          description: gi.description ?? gi.notes ?? null,
          ordered_quantity: Number(gi.ordered_quantity) || 0,
          received_quantity: Number(gi.received_quantity) || 0,
          accepted_quantity: gi.accepted_quantity != null ? Number(gi.accepted_quantity) : Number(gi.received_quantity),
          unit: gi.unit ?? null,
          unit_cost: Number(gi.unit_cost) || 0,
          tax_percentage: gi.tax_percentage != null ? Number(gi.tax_percentage) : 0,
        }))
      } else {
        // Base columns only (pre-migration)
        const { data: baseItems } = await admin
          .from('grn_items')
          .select('id, grn_id, product_id, ordered_quantity, received_quantity, unit_cost, notes')
          .eq('grn_id', grn.id)

        if (baseItems && baseItems.length > 0) {
          grnItems = baseItems.map((gi: {
            id: string; grn_id: string; product_id: string | null
            ordered_quantity: number; received_quantity: number; unit_cost: number; notes: string | null
          }) => ({
            id: gi.id,
            item_name: gi.notes ?? null,
            description: gi.notes ?? null,
            ordered_quantity: Number(gi.ordered_quantity) || 0,
            received_quantity: Number(gi.received_quantity) || 0,
            accepted_quantity: Number(gi.received_quantity) || 0,
            unit: null,
            unit_cost: Number(gi.unit_cost) || 0,
            tax_percentage: 0,
          }))
        }
      }
    }

    return {
      id: po.id,
      po_number: po.po_number,
      total_amount: po.total_amount,
      vendor_id: po.vendor_id,
      company_id: po.company_id,
      status: po.status,
      vendor_acceptance: po.vendor_acceptance ?? null,
      vendor: po.vendor ?? null,
      items: (po.items ?? []).map((pi: { id: string; description: string; quantity: number; unit: string | null; unit_price: number }) => ({
        id: pi.id,
        description: pi.description,
        quantity: Number(pi.quantity) || 0,
        unit: pi.unit ?? null,
        unit_price: Number(pi.unit_price) || 0,
      })),
      completed_grn: grn ? {
        id: grn.id,
        grn_number: grn.grn_number,
        received_date: grn.received_date,
        grn_items: grnItems,
      } : null,
    }
  } catch (e) {
    console.error('[fetchPOForInvoiceDirect] error:', e)
    return null
  }
}
