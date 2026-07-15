/**
 * analytics.ts — All Supabase aggregation queries for Stage 10 Analytics.
 * Server-side only. No mock data.
 */
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as {
    from: (table: string) => any
    rpc: (fn: string, args?: any) => any
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────
function monthRange(monthsBack: number) {
  const results: { label: string; from: string; to: string }[] = []
  const now = new Date()
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    results.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      from: `${y}-${String(m).padStart(2, '0')}-01`,
      to: `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`,
    })
  }
  return results
}

export type ChartPoint = { name: string; value: number; color?: string }
export type TimePoint = { month: string; value: number }
export type MultiTimePoint = { month: string; [key: string]: number | string }

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTIVE KPIs
// ─────────────────────────────────────────────────────────────────────────────
export interface ExecutiveKpis {
  total_vendors: number
  active_vendors: number
  total_rfqs: number
  active_rfqs: number
  total_quotations: number
  quotation_acceptance_rate: number
  total_pos: number
  total_procurement_spend: number
  inventory_value: number
  low_stock_items: number
  pending_approvals: number
  completed_approvals: number
  total_invoices: number
  outstanding_amount: number
  paid_amount: number
  payments_this_month: number
}

export async function getExecutiveKpis(companyId: string): Promise<ExecutiveKpis> {
  const supabase = await db()
  const today = new Date()
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const [
    totalVendors, activeVendors,
    totalRfqs, activeRfqs,
    totalQuotations, approvedQuotations,
    totalPos,
    payments, monthPayments,
    invValue,
    lowStockRows, outOfStockCount,
    pendingApprovals, completedApprovals,
    totalInvoices, outstandingRows, paidRows,
  ] = await Promise.all([
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active'),
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['draft', 'sent', 'under_review']),
    supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'approved'),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('payments').select('amount').eq('company_id', companyId),
    supabase.from('payments').select('amount').eq('company_id', companyId).gte('payment_date', monthStart),
    supabase.from('inventory').select('valuation').eq('company_id', companyId),
    supabase.from('inventory').select('quantity_available, product:products!inner(reorder_level)').eq('company_id', companyId).gt('quantity_available', 0).limit(2000),
    supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('company_id', companyId).lte('quantity_available', 0),
    // Pending approvals = items in pending/draft status across all entity types
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['draft', 'pending_approval']),
    supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['submitted', 'under_review']),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('invoices').select('remaining_amount').eq('company_id', companyId).in('status', ['approved', 'partially_paid']),
    supabase.from('invoices').select('paid_amount').eq('company_id', companyId).in('status', ['paid', 'partially_paid']),
  ])

  const totalSpend = (payments.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
  const monthSpend = (monthPayments.data ?? []).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
  const invVal = (invValue.data ?? []).reduce((s: number, r: { valuation: number }) => s + (r.valuation ?? 0), 0)
  const lowStock = (lowStockRows.data ?? []).filter((r: { quantity_available: number; product: { reorder_level: number } }) => r.quantity_available <= r.product.reorder_level).length
  const outstanding = (outstandingRows.data ?? []).reduce((s: number, r: { remaining_amount: number }) => s + r.remaining_amount, 0)
  const paid = (paidRows.data ?? []).reduce((s: number, r: { paid_amount: number }) => s + r.paid_amount, 0)
  const totalQ = totalQuotations.count ?? 0
  const approvedQ = approvedQuotations.count ?? 0

  // pendingApprovals = pending RFQs + pending quotations
  // completedApprovals = all approved POs
  const pendingCount = (pendingApprovals.count ?? 0) + (completedApprovals.count ?? 0)
  // For completed: count approved POs as a proxy
  const { count: approvedPOs } = await supabase
    .from('purchase_orders').select('id', { count: 'exact', head: true })
    .eq('company_id', companyId).in('status', ['approved', 'completed'])

  return {
    total_vendors: totalVendors.count ?? 0,
    active_vendors: activeVendors.count ?? 0,
    total_rfqs: totalRfqs.count ?? 0,
    active_rfqs: activeRfqs.count ?? 0,
    total_quotations: totalQ,
    quotation_acceptance_rate: totalQ > 0 ? Math.round((approvedQ / totalQ) * 100) : 0,
    total_pos: totalPos.count ?? 0,
    total_procurement_spend: totalSpend,
    inventory_value: invVal,
    low_stock_items: lowStock + (outOfStockCount.count ?? 0),
    pending_approvals: pendingCount,
    completed_approvals: approvedPOs ?? 0,
    total_invoices: totalInvoices.count ?? 0,
    outstanding_amount: outstanding,
    paid_amount: paid,
    payments_this_month: monthSpend,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCUREMENT ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export interface ProcurementAnalytics {
  po_by_status: ChartPoint[]
  monthly_po_count: TimePoint[]
  monthly_spend: TimePoint[]
  avg_po_value: number
  top_vendors_by_spend: { vendor_name: string; spend: number }[]
  top_vendors_by_orders: { vendor_name: string; orders: number }[]
}

export async function getProcurementAnalytics(companyId: string): Promise<ProcurementAnalytics> {
  const supabase = await db()

  const PO_STATUS_COLORS: Record<string, string> = {
    draft: '#94a3b8', pending_approval: '#f59e0b', approved: '#4350ed',
    sent: '#06b6d4', acknowledged: '#8b5cf6', in_progress: '#f97316',
    completed: '#22c55e', cancelled: '#ef4444',
  }

  const [poData, paymentData] = await Promise.all([
    supabase.from('purchase_orders').select('id, status, total_amount, created_at, vendor_id, vendor:vendors(name)').eq('company_id', companyId).limit(2000),
    supabase.from('payments').select('amount, payment_date, vendor_id, vendor:vendors(name)').eq('company_id', companyId).limit(5000),
  ])

  type PoRow = { id: string; status: string; total_amount: number | null; created_at: string; vendor_id: string; vendor: { name: string } | null }
  type PayRow = { amount: number; payment_date: string; vendor_id: string; vendor: { name: string } | null }

  const pos = (poData.data ?? []) as PoRow[]
  const pays = (paymentData.data ?? []) as PayRow[]

  // PO by status
  const statusMap: Record<string, number> = {}
  for (const p of pos) { statusMap[p.status] = (statusMap[p.status] ?? 0) + 1 }
  const po_by_status: ChartPoint[] = Object.entries(statusMap).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
    color: PO_STATUS_COLORS[name] ?? '#94a3b8',
  }))

  // Monthly PO count (last 12 months)
  const months = monthRange(12)
  const monthly_po_count: TimePoint[] = months.map(({ label, from, to }) => ({
    month: label,
    value: pos.filter((p) => p.created_at >= from && p.created_at <= to + 'T23:59:59').length,
  }))

  // Monthly spend from payments
  const monthly_spend: TimePoint[] = months.map(({ label, from, to }) => ({
    month: label,
    value: pays.filter((p) => p.payment_date >= from && p.payment_date <= to).reduce((s, p) => s + p.amount, 0),
  }))

  // Avg PO value
  const posWithAmount = pos.filter((p) => p.total_amount != null)
  const avg_po_value = posWithAmount.length > 0
    ? posWithAmount.reduce((s, p) => s + (p.total_amount ?? 0), 0) / posWithAmount.length
    : 0

  // Top vendors by spend
  const vendorSpend: Record<string, { name: string; spend: number }> = {}
  for (const p of pays) {
    const name = (p.vendor as { name: string } | null)?.name ?? p.vendor_id
    if (!vendorSpend[p.vendor_id]) vendorSpend[p.vendor_id] = { name, spend: 0 }
    vendorSpend[p.vendor_id].spend += p.amount
  }
  const top_vendors_by_spend = Object.values(vendorSpend)
    .sort((a, b) => b.spend - a.spend).slice(0, 8)
    .map((v) => ({ vendor_name: v.name, spend: v.spend }))

  // Top vendors by orders
  const vendorOrders: Record<string, { name: string; orders: number }> = {}
  for (const p of pos) {
    const name = (p.vendor as { name: string } | null)?.name ?? p.vendor_id
    if (!vendorOrders[p.vendor_id]) vendorOrders[p.vendor_id] = { name, orders: 0 }
    vendorOrders[p.vendor_id].orders++
  }
  const top_vendors_by_orders = Object.values(vendorOrders)
    .sort((a, b) => b.orders - a.orders).slice(0, 8)
    .map((v) => ({ vendor_name: v.name, orders: v.orders }))

  return { po_by_status, monthly_po_count, monthly_spend, avg_po_value, top_vendors_by_spend, top_vendors_by_orders }
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export interface VendorAnalytics {
  total: number
  active: number
  inactive: number
  pending: number
  suspended: number
  by_category: ChartPoint[]
  top_by_orders: { vendor_name: string; orders: number }[]
  top_by_spend: { vendor_name: string; spend: number }[]
  top_by_quotations: { vendor_name: string; quotations: number }[]
}

export async function getVendorAnalytics(companyId: string): Promise<VendorAnalytics> {
  const supabase = await db()
  const CATEGORY_COLORS: Record<string, string> = {
    software: '#4350ed', hardware: '#8b5cf6', services: '#22c55e',
    consulting: '#f59e0b', logistics: '#06b6d4', marketing: '#ec4899',
    finance: '#14b8a6', legal: '#f97316', other: '#94a3b8',
  }

  const [vendors, pos, pays, quotes] = await Promise.all([
    supabase.from('vendors').select('id, status, category').eq('company_id', companyId).limit(5000),
    supabase.from('purchase_orders').select('vendor_id, vendor:vendors(name)').eq('company_id', companyId).limit(5000),
    supabase.from('payments').select('vendor_id, amount, vendor:vendors(name)').eq('company_id', companyId).limit(5000),
    supabase.from('quotations').select('vendor_id, vendor:vendors(name)').eq('company_id', companyId).limit(5000),
  ])

  type VendorRow = { id: string; status: string; category: string | null }
  type PoVRow = { vendor_id: string; vendor: { name: string } | null }
  type PayVRow = { vendor_id: string; amount: number; vendor: { name: string } | null }
  type QuoteVRow = { vendor_id: string; vendor: { name: string } | null }

  const vs = (vendors.data ?? []) as VendorRow[]
  const poRows = (pos.data ?? []) as PoVRow[]
  const payRows = (pays.data ?? []) as PayVRow[]
  const quoteRows = (quotes.data ?? []) as QuoteVRow[]

  const statusCount = (s: string) => vs.filter((v) => v.status === s).length

  // Category distribution
  const catMap: Record<string, number> = {}
  for (const v of vs) {
    const cat = (v.category as string | null) ?? 'other'
    catMap[cat] = (catMap[cat] ?? 0) + 1
  }
  const by_category: ChartPoint[] = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: CATEGORY_COLORS[name] ?? `hsl(${i * 47}, 65%, 55%)`,
    }))

  // Top by orders
  const orderMap: Record<string, { name: string; n: number }> = {}
  for (const p of poRows) {
    const n = (p.vendor as { name: string } | null)?.name ?? p.vendor_id
    if (!orderMap[p.vendor_id]) orderMap[p.vendor_id] = { name: n, n: 0 }
    orderMap[p.vendor_id].n++
  }
  const top_by_orders = Object.values(orderMap).sort((a, b) => b.n - a.n).slice(0, 8)
    .map((v) => ({ vendor_name: v.name, orders: v.n }))

  // Top by spend
  const spendMap: Record<string, { name: string; s: number }> = {}
  for (const p of payRows) {
    const n = (p.vendor as { name: string } | null)?.name ?? p.vendor_id
    if (!spendMap[p.vendor_id]) spendMap[p.vendor_id] = { name: n, s: 0 }
    spendMap[p.vendor_id].s += p.amount
  }
  const top_by_spend = Object.values(spendMap).sort((a, b) => b.s - a.s).slice(0, 8)
    .map((v) => ({ vendor_name: v.name, spend: v.s }))

  // Top by quotations
  const qMap: Record<string, { name: string; n: number }> = {}
  for (const q of quoteRows) {
    const n = (q.vendor as { name: string } | null)?.name ?? q.vendor_id
    if (!qMap[q.vendor_id]) qMap[q.vendor_id] = { name: n, n: 0 }
    qMap[q.vendor_id].n++
  }
  const top_by_quotations = Object.values(qMap).sort((a, b) => b.n - a.n).slice(0, 8)
    .map((v) => ({ vendor_name: v.name, quotations: v.n }))

  return {
    total: vs.length,
    active: statusCount('active'),
    inactive: statusCount('inactive'),
    pending: statusCount('pending'),
    suspended: statusCount('suspended'),
    by_category,
    top_by_orders,
    top_by_spend,
    top_by_quotations,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RFQ ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export interface RfqAnalytics {
  total: number
  open: number
  awarded: number
  cancelled: number
  by_status: ChartPoint[]
  monthly_created: TimePoint[]
}

export async function getRfqAnalytics(companyId: string): Promise<RfqAnalytics> {
  const supabase = await db()
  const STATUS_COLORS: Record<string, string> = {
    draft: '#94a3b8', sent: '#4350ed', under_review: '#8b5cf6',
    awarded: '#22c55e', cancelled: '#ef4444',
  }

  const { data } = await supabase
    .from('rfqs').select('id, status, created_at').eq('company_id', companyId).limit(5000)
  type RfqRow = { id: string; status: string; created_at: string }
  const rows = (data ?? []) as RfqRow[]

  const statusMap: Record<string, number> = {}
  for (const r of rows) { statusMap[r.status] = (statusMap[r.status] ?? 0) + 1 }

  const by_status: ChartPoint[] = Object.entries(statusMap).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value, color: STATUS_COLORS[name] ?? '#94a3b8',
  }))

  const months = monthRange(12)
  const monthly_created: TimePoint[] = months.map(({ label, from, to }) => ({
    month: label,
    value: rows.filter((r) => r.created_at >= from && r.created_at <= to + 'T23:59:59').length,
  }))

  const count = (s: string | string[]) => Array.isArray(s)
    ? rows.filter((r: RfqRow) => s.includes(r.status)).length
    : rows.filter((r: RfqRow) => r.status === s).length

  return {
    total: rows.length,
    open: count(['draft', 'sent', 'under_review']),
    awarded: count('awarded'),
    cancelled: count('cancelled'),
    by_status,
    monthly_created,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export interface InventoryAnalytics {
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
  total_products: number
  by_warehouse: { warehouse_name: string; value: number; qty: number }[]
  low_stock_products: { product_name: string; sku: string; available: number; reorder_level: number }[]
  top_products_by_value: { product_name: string; sku: string; value: number }[]
}

export async function getInventoryAnalytics(companyId: string): Promise<InventoryAnalytics> {
  const supabase = await db()

  // Fetch inventory rows (may be empty if no GRNs completed yet)
  const { data: invData } = await supabase
    .from('inventory')
    .select(`
      quantity_available, valuation,
      product:products!inner(id, name, sku, reorder_level),
      warehouse:warehouses!inner(id, name)
    `)
    .eq('company_id', companyId)
    .limit(5000)

  // Also fetch all active products (even if not yet in inventory)
  const { data: allProducts, count: productCount } = await supabase
    .from('products')
    .select('id, name, sku, unit_cost, status', { count: 'exact' })
    .eq('company_id', companyId)
    .eq('status', 'active')
    .limit(5000)

  type InvRow = {
    quantity_available: number
    valuation: number
    product: { id: string; name: string; sku: string; reorder_level: number }
    warehouse: { id: string; name: string }
  }

  const rows = (invData ?? []) as InvRow[]
  const products = (allProducts ?? []) as { id: string; name: string; sku: string; unit_cost: number; status: string }[]

  const total_value = rows.reduce((s, r) => s + (r.valuation ?? 0), 0)
  const low_stock = rows.filter((r) => r.quantity_available > 0 && r.quantity_available <= r.product.reorder_level)
  const out_of_stock = rows.filter((r) => r.quantity_available <= 0)

  // Unique products in inventory
  const productIdsInInventory = new Set(rows.map((r) => r.product.id))
  // Total = max of products in inventory OR total active products
  const total_products_count = Math.max(productIdsInInventory.size, productCount ?? 0)

  // By warehouse
  const whMap: Record<string, { warehouse_name: string; value: number; qty: number }> = {}
  for (const r of rows) {
    const wh = r.warehouse
    if (!whMap[wh.id]) whMap[wh.id] = { warehouse_name: wh.name, value: 0, qty: 0 }
    whMap[wh.id].value += r.valuation ?? 0
    whMap[wh.id].qty += r.quantity_available
  }
  const by_warehouse = Object.values(whMap).sort((a, b) => b.value - a.value)

  // Low stock products
  const low_stock_products = low_stock
    .sort((a, b) => a.quantity_available - b.quantity_available)
    .slice(0, 10)
    .map((r) => ({
      product_name: r.product.name,
      sku: r.product.sku,
      available: r.quantity_available,
      reorder_level: r.product.reorder_level,
    }))

  // Top by value — use inventory valuation if available, otherwise use product unit_cost
  let top_products_by_value: { product_name: string; sku: string; value: number }[]

  if (rows.length > 0) {
    top_products_by_value = [...rows]
      .sort((a, b) => (b.valuation ?? 0) - (a.valuation ?? 0))
      .slice(0, 10)
      .map((r) => ({ product_name: r.product.name, sku: r.product.sku, value: r.valuation ?? 0 }))
  } else {
    // No inventory yet — show products by unit_cost as estimate
    top_products_by_value = [...products]
      .sort((a, b) => (b.unit_cost ?? 0) - (a.unit_cost ?? 0))
      .slice(0, 10)
      .map((p) => ({ product_name: p.name, sku: p.sku, value: p.unit_cost ?? 0 }))
  }

  return {
    total_value,
    low_stock_count: low_stock.length,
    out_of_stock_count: out_of_stock.length,
    total_products: total_products_count,
    by_warehouse,
    low_stock_products,
    top_products_by_value,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
export interface FinanceAnalytics {
  total_invoices: number
  total_invoiced: number
  total_paid: number
  outstanding: number
  avg_invoice_value: number
  by_status: ChartPoint[]
  monthly_payments: TimePoint[]
  vendor_outstanding: { vendor_name: string; outstanding: number }[]
  aging: { label: string; count: number; amount: number }[]
}

export async function getFinanceAnalytics(companyId: string): Promise<FinanceAnalytics> {
  const supabase = await db()
  const INV_STATUS_COLORS: Record<string, string> = {
    draft: '#94a3b8', submitted: '#f59e0b', approved: '#4350ed',
    partially_paid: '#06b6d4', paid: '#22c55e', cancelled: '#ef4444',
  }

  const [invData, payData] = await Promise.all([
    supabase.from('invoices')
      .select('id, status, total_amount, paid_amount, remaining_amount, due_date, vendor:vendors(id, name)')
      .eq('company_id', companyId).limit(5000),
    supabase.from('payments')
      .select('amount, payment_date').eq('company_id', companyId).limit(10000),
  ])

  type InvRow = {
    id: string; status: string; total_amount: number | null; paid_amount: number | null
    remaining_amount: number; due_date: string | null; vendor: { id: string; name: string } | null
  }
  type FinPayRow = { amount: number; payment_date: string }

  const invs = (invData.data ?? []) as InvRow[]
  const pays = (payData.data ?? []) as FinPayRow[]

  // By status
  const statusMap: Record<string, number> = {}
  for (const i of invs) { statusMap[i.status] = (statusMap[i.status] ?? 0) + 1 }
  const by_status: ChartPoint[] = Object.entries(statusMap).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value, color: INV_STATUS_COLORS[name] ?? '#94a3b8',
  }))

  const months = monthRange(12)
  const monthly_payments: TimePoint[] = months.map(({ label, from, to }) => ({
    month: label,
    value: pays.filter((p) => p.payment_date >= from && p.payment_date <= to)
      .reduce((s: number, p: { amount: number }) => s + p.amount, 0),
  }))

  // Vendor outstanding
  const vMap: Record<string, { vendor_name: string; outstanding: number }> = {}
  for (const inv of invs) {
    if (!['approved', 'partially_paid'].includes(inv.status)) continue
    const vendor = inv.vendor
    if (!vendor) continue
    if (!vMap[vendor.id]) vMap[vendor.id] = { vendor_name: vendor.name, outstanding: 0 }
    vMap[vendor.id].outstanding += inv.remaining_amount ?? 0
  }
  const vendor_outstanding = Object.values(vMap).sort((a, b) => b.outstanding - a.outstanding).slice(0, 8)

  // Aging
  const today = new Date()
  const buckets = [
    { label: 'Current', min: -Infinity, max: 0 },
    { label: '1–30 days', min: 1, max: 30 },
    { label: '31–60 days', min: 31, max: 60 },
    { label: '61–90 days', min: 61, max: 90 },
    { label: '90+ days', min: 91, max: Infinity },
  ]
  const aging = buckets.map(({ label, min, max }) => {
    const bucket = invs.filter((inv) => {
      if (!['approved', 'partially_paid'].includes(inv.status) || !inv.due_date) return label === 'Current' && inv.remaining_amount > 0
      const days = Math.floor((today.getTime() - new Date(inv.due_date).getTime()) / 86400000)
      return days >= min && days <= max
    })
    return {
      label,
      count: bucket.length,
      amount: bucket.reduce((s, inv) => s + (inv.remaining_amount ?? 0), 0),
    }
  })

  const nonCancelled = invs.filter((i) => i.status !== 'cancelled')
  const avg_invoice_value = nonCancelled.length > 0
    ? nonCancelled.reduce((s, i) => s + (i.total_amount ?? 0), 0) / nonCancelled.length : 0
  const total_invoiced = invs.reduce((s, i) => s + (i.total_amount ?? 0), 0)
  const total_paid = invs.reduce((s, i) => s + (i.paid_amount ?? 0), 0)
  const outstanding = invs.filter((i) => ['approved', 'partially_paid'].includes(i.status))
    .reduce((s, i) => s + (i.remaining_amount ?? 0), 0)

  return {
    total_invoices: invs.length,
    total_invoiced,
    total_paid,
    outstanding,
    avg_invoice_value,
    by_status,
    monthly_payments,
    vendor_outstanding,
    aging,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROVAL ANALYTICS
// Uses real entity data from rfqs, quotations, purchase_orders, invoices
// instead of the (now-removed) approval_requests table.
// ─────────────────────────────────────────────────────────────────────────────
export interface ApprovalAnalytics {
  total: number
  pending: number
  approved: number
  rejected: number
  by_status: ChartPoint[]
  by_type: ChartPoint[]
  monthly_requests: TimePoint[]
  completion_rate: number
}

export async function getApprovalAnalytics(companyId: string): Promise<ApprovalAnalytics> {
  const supabase = await db()

  const PENDING_STATUSES = {
    rfq: ['draft', 'pending_approval'],
    quotation: ['submitted', 'under_review', 'shortlisted'],
    purchase_order: ['draft', 'pending_approval'],
    invoice: ['submitted', 'under_review'],
  }
  const APPROVED_STATUSES = {
    rfq: ['approved', 'sent', 'awarded'],
    quotation: ['approved', 'selected', 'closed'],
    purchase_order: ['approved', 'sent', 'acknowledged', 'in_progress', 'completed'],
    invoice: ['approved', 'partially_paid', 'paid'],
  }
  const REJECTED_STATUSES = {
    rfq: ['rejected', 'cancelled'],
    quotation: ['rejected', 'withdrawn'],
    purchase_order: ['rejected', 'cancelled'],
    invoice: ['rejected', 'cancelled'],
  }

  const [rfqs, quotations, pos, invoices] = await Promise.all([
    supabase.from('rfqs').select('id, status, created_at').eq('company_id', companyId).limit(5000),
    supabase.from('quotations').select('id, status, created_at').eq('company_id', companyId).limit(5000),
    supabase.from('purchase_orders').select('id, status, created_at').eq('company_id', companyId).limit(5000),
    supabase.from('invoices').select('id, status, created_at').eq('company_id', companyId).limit(5000),
  ])

  type Row = { id: string; status: string; created_at: string }
  const rfqRows = (rfqs.data ?? []) as Row[]
  const quotRows = (quotations.data ?? []) as Row[]
  const poRows  = (pos.data ?? []) as Row[]
  const invRows = (invoices.data ?? []) as Row[]

  const all = [
    ...rfqRows.map((r) => ({ ...r, type: 'rfq' })),
    ...quotRows.map((r) => ({ ...r, type: 'quotation' })),
    ...poRows.map((r) => ({ ...r, type: 'purchase_order' })),
    ...invRows.map((r) => ({ ...r, type: 'invoice' })),
  ]

  const isPending = (r: { type: string; status: string }) =>
    PENDING_STATUSES[r.type as keyof typeof PENDING_STATUSES]?.includes(r.status) ?? false
  const isApproved = (r: { type: string; status: string }) =>
    APPROVED_STATUSES[r.type as keyof typeof APPROVED_STATUSES]?.includes(r.status) ?? false
  const isRejected = (r: { type: string; status: string }) =>
    REJECTED_STATUSES[r.type as keyof typeof REJECTED_STATUSES]?.includes(r.status) ?? false

  const pending  = all.filter(isPending).length
  const approved = all.filter(isApproved).length
  const rejected = all.filter(isRejected).length
  const total    = all.length

  // By status
  const by_status: ChartPoint[] = [
    { name: 'Pending',  value: pending,  color: '#f59e0b' },
    { name: 'Approved', value: approved, color: '#22c55e' },
    { name: 'Rejected', value: rejected, color: '#ef4444' },
  ].filter((s) => s.value > 0)

  // By type
  const typeColors: Record<string, string> = {
    rfq: '#4350ed', quotation: '#8b5cf6', purchase_order: '#f97316', invoice: '#06b6d4',
  }
  const by_type: ChartPoint[] = [
    { name: 'RFQs',            value: rfqRows.length,  color: typeColors.rfq },
    { name: 'Quotations',      value: quotRows.length, color: typeColors.quotation },
    { name: 'Purchase Orders', value: poRows.length,   color: typeColors.purchase_order },
    { name: 'Invoices',        value: invRows.length,  color: typeColors.invoice },
  ].filter((t) => t.value > 0)

  // Monthly trend (last 12 months)
  const months = monthRange(12)
  const monthly_requests: TimePoint[] = months.map(({ label, from, to }) => ({
    month: label,
    value: all.filter((r) => r.created_at >= from && r.created_at <= to + 'T23:59:59').length,
  }))

  const resolved = approved + rejected
  const completion_rate = total > 0 ? Math.round((resolved / total) * 100) : 0

  return { total, pending, approved, rejected, by_status, by_type, monthly_requests, completion_rate }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTIVE CHART DATA — for the main analytics page
// ─────────────────────────────────────────────────────────────────────────────
export interface ExecutiveChartData {
  monthly_spend: TimePoint[]
  monthly_po_count: TimePoint[]
  vendor_categories: ChartPoint[]
  rfq_status: ChartPoint[]
  approval_status: ChartPoint[]
  invoice_status: ChartPoint[]
  top_products_by_value: { product_name: string; sku: string; value: number }[]
}

export async function getExecutiveChartData(companyId: string): Promise<ExecutiveChartData> {
  const [proc, vendors, rfqs, finance, approvals, inv] = await Promise.all([
    getProcurementAnalytics(companyId),
    getVendorAnalytics(companyId),
    getRfqAnalytics(companyId),
    getFinanceAnalytics(companyId),
    getApprovalAnalytics(companyId),
    getInventoryAnalytics(companyId),
  ])
  return {
    monthly_spend: proc.monthly_spend,
    monthly_po_count: proc.monthly_po_count,
    vendor_categories: vendors.by_category,
    rfq_status: rfqs.by_status,
    approval_status: approvals.by_status,
    invoice_status: finance.by_status,
    top_products_by_value: inv.top_products_by_value,
  }
}
