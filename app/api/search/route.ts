/**
 * GET /api/search?q=<query>
 * Global search across RFQs, POs, Vendors, Products, Invoices, Quotations,
 * Approvals, Employees (admin-only), Warehouses.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId, getUserRole } from '@/lib/supabase/get-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const [companyId, role] = await Promise.all([getCompanyId(), getUserRole()])
    const isAdmin = role === 'administrator' || role === 'admin'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (await createClient()) as any

    const like = `%${q}%`
    const results: {
      id: string
      type: string
      title: string
      subtitle: string
      href: string
    }[] = []

    // Run searches in parallel — only fetch what the role can access
    const searches: Promise<void>[] = []

    // ── RFQs ────────────────────────────────────────────────────────────────
    if (['administrator', 'admin', 'procurement_officer', 'procurement_manager'].includes(role)) {
      searches.push(
        db.from('rfqs')
          .select('id, rfq_number, title, status')
          .eq('company_id', companyId)
          .or(`rfq_number.ilike.${like},title.ilike.${like}`)
          .limit(5)
          .then(({ data }: { data: { id: string; rfq_number: string; title: string; status: string }[] | null }) => {
            for (const r of data ?? []) {
              results.push({
                id: `rfq-${r.id}`,
                type: 'rfq',
                title: r.rfq_number,
                subtitle: r.title ?? '—',
                href: `/rfqs/${r.id}`,
              })
            }
          })
      )
    }

    // ── Purchase Orders ──────────────────────────────────────────────────────
    if (['administrator', 'admin', 'procurement_officer', 'procurement_manager'].includes(role)) {
      searches.push(
        db.from('purchase_orders')
          .select('id, po_number, status')
          .eq('company_id', companyId)
          .ilike('po_number', like)
          .limit(5)
          .then(({ data }: { data: { id: string; po_number: string; status: string }[] | null }) => {
            for (const r of data ?? []) {
              results.push({
                id: `po-${r.id}`,
                type: 'purchase_order',
                title: r.po_number,
                subtitle: `Status: ${r.status.replace(/_/g, ' ')}`,
                href: `/purchase-orders/${r.id}`,
              })
            }
          })
      )
    }

    // ── Vendors ──────────────────────────────────────────────────────────────
    if (['administrator', 'admin', 'procurement_officer', 'procurement_manager'].includes(role)) {
      searches.push(
        db.from('vendors')
          .select('id, name, status, category')
          .eq('company_id', companyId)
          .or(`name.ilike.${like},email.ilike.${like}`)
          .limit(5)
          .then(({ data }: { data: { id: string; name: string; status: string; category: string | null }[] | null }) => {
            for (const r of data ?? []) {
              results.push({
                id: `vendor-${r.id}`,
                type: 'vendor',
                title: r.name,
                subtitle: `${r.category ?? 'Vendor'} · ${r.status}`,
                href: `/vendors/${r.id}`,
              })
            }
          })
      )
    }

    // ── Products ─────────────────────────────────────────────────────────────
    if (isAdmin) {
      searches.push(
        db.from('products')
          .select('id, name, sku, category')
          .eq('company_id', companyId)
          .or(`name.ilike.${like},sku.ilike.${like}`)
          .limit(5)
          .then(({ data }: { data: { id: string; name: string; sku: string | null; category: string | null }[] | null }) => {
            for (const r of data ?? []) {
              results.push({
                id: `product-${r.id}`,
                type: 'product',
                title: r.name,
                subtitle: r.sku ? `SKU: ${r.sku}` : (r.category ?? 'Product'),
                href: `/products/${r.id}`,
              })
            }
          })
      )
    }

    // ── Invoices ─────────────────────────────────────────────────────────────
    if (['administrator', 'admin', 'finance_manager'].includes(role)) {
      searches.push(
        db.from('invoices')
          .select('id, invoice_number, status, total_amount')
          .eq('company_id', companyId)
          .ilike('invoice_number', like)
          .limit(5)
          .then(({ data }: { data: { id: string; invoice_number: string; status: string; total_amount: number | null }[] | null }) => {
            for (const r of data ?? []) {
              results.push({
                id: `invoice-${r.id}`,
                type: 'invoice',
                title: r.invoice_number,
                subtitle: `${r.status.replace(/_/g, ' ')}${r.total_amount ? ` · ₹${r.total_amount.toLocaleString('en-IN')}` : ''}`,
                href: `/payments/invoices/${r.id}`,
              })
            }
          })
      )
    }

    // ── Quotations ───────────────────────────────────────────────────────────
    if (['administrator', 'admin', 'procurement_manager'].includes(role)) {
      searches.push(
        db.from('quotations')
          .select('id, quotation_number, status, grand_total')
          .eq('company_id', companyId)
          .ilike('quotation_number', like)
          .limit(5)
          .then(({ data }: { data: { id: string; quotation_number: string; status: string; grand_total: number | null }[] | null }) => {
            for (const r of data ?? []) {
              results.push({
                id: `quotation-${r.id}`,
                type: 'quotation',
                title: r.quotation_number,
                subtitle: `${r.status.replace(/_/g, ' ')}${r.grand_total ? ` · ₹${r.grand_total.toLocaleString('en-IN')}` : ''}`,
                href: `/quotations/${r.id}`,
              })
            }
          })
      )
    }

    // ── Approvals ────────────────────────────────────────────────────────────
    if (['administrator', 'admin', 'procurement_manager'].includes(role)) {
      searches.push(
        db.from('approval_requests')
          .select('id, title, status, entity_type')
          .eq('company_id', companyId)
          .or(`title.ilike.${like},entity_ref.ilike.${like}`)
          .limit(5)
          .then(({ data }: { data: { id: string; title: string; status: string; entity_type: string }[] | null }) => {
            for (const r of data ?? []) {
              results.push({
                id: `approval-${r.id}`,
                type: 'approval',
                title: r.title ?? '—',
                subtitle: `${r.entity_type.replace(/_/g, ' ')} · ${r.status.replace(/_/g, ' ')}`,
                href: `/approvals/${r.id}`,
              })
            }
          })
      )
    }

    // ── Employees (admin only) ────────────────────────────────────────────────
    if (isAdmin) {
      searches.push(
        db.from('users')
          .select('id, full_name, email, role')
          .eq('company_id', companyId)
          .or(`full_name.ilike.${like},email.ilike.${like}`)
          .limit(5)
          .then(({ data }: { data: { id: string; full_name: string | null; email: string | null; role: string }[] | null }) => {
            for (const r of data ?? []) {
              results.push({
                id: `employee-${r.id}`,
                type: 'employee',
                title: r.full_name ?? r.email ?? '—',
                subtitle: r.role.replace(/_/g, ' '),
                href: `/settings/employees/${r.id}`,
              })
            }
          })
      )
    }

    // ── Warehouses ───────────────────────────────────────────────────────────
    if (['administrator', 'admin', 'warehouse_manager'].includes(role)) {
      searches.push(
        db.from('warehouses')
          .select('id, name, location')
          .eq('company_id', companyId)
          .or(`name.ilike.${like},location.ilike.${like}`)
          .limit(5)
          .then(({ data }: { data: { id: string; name: string; location: string | null }[] | null }) => {
            for (const r of data ?? []) {
              results.push({
                id: `warehouse-${r.id}`,
                type: 'warehouse',
                title: r.name,
                subtitle: r.location ?? 'Warehouse',
                href: `/inventory/warehouses/${r.id}`,
              })
            }
          })
      )
    }

    await Promise.allSettled(searches)

    // Deduplicate and limit total results
    const seen = new Set<string>()
    const deduped = results.filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    }).slice(0, 20)

    return NextResponse.json({ results: deduped })
  } catch (err) {
    console.error('[Search API] Error:', err)
    return NextResponse.json({ results: [] })
  }
}
