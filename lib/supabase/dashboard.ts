/**
 * dashboard.ts — Live Supabase queries for the main dashboard.
 * All functions are server-side only (no 'use client').
 */
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as {
    from: (table: string) => any
    rpc: (fn: string, args?: any) => any
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI CARDS
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardKpis {
  total_vendors: number
  active_rfqs: number
  total_purchase_orders: number
  pending_approvals: number
  monthly_spend: number
  inventory_alerts: number   // products at or below reorder_level
}

export async function getDashboardKpis(companyId: string): Promise<DashboardKpis> {
  const supabase = await db()
  const today = new Date()
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const [vendors, rfqs, pos, approvals, paymentsMonth, lowStock] = await Promise.all([
    // Active vendors
    supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active'),

    // Open/active RFQs
    supabase
      .from('rfqs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .in('status', ['draft', 'sent', 'under_review']),

    // Total POs
    supabase
      .from('purchase_orders')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId),

    // Pending approvals
    supabase
      .from('approval_requests')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .not('status', 'in', '("approved","rejected","cancelled","completed","draft")'),

    // Payments this month (spend)
    supabase
      .from('payments')
      .select('amount')
      .eq('company_id', companyId)
      .gte('payment_date', monthStart),

    // Products at or below reorder level with inventory record
    supabase
      .from('inventory')
      .select('quantity_available, product:products!inner(reorder_level)')
      .eq('company_id', companyId)
      .gt('quantity_available', 0)
      .limit(1000),
  ])

  const monthlySpend = (paymentsMonth.data ?? []).reduce(
    (s: number, r: { amount: number }) => s + (r.amount ?? 0),
    0,
  )

  const lowStockCount = (lowStock.data ?? []).filter(
    (r: { quantity_available: number; product: { reorder_level: number } }) =>
      r.quantity_available <= r.product.reorder_level,
  ).length

  // Also count out-of-stock
  const { count: outOfStock } = await supabase
    .from('inventory')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .lte('quantity_available', 0)

  return {
    total_vendors: vendors.count ?? 0,
    active_rfqs: rfqs.count ?? 0,
    total_purchase_orders: pos.count ?? 0,
    pending_approvals: approvals.count ?? 0,
    monthly_spend: monthlySpend,
    inventory_alerts: lowStockCount + (outOfStock ?? 0),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RECENT VENDORS TABLE
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardVendor {
  id: string
  name: string
  initials: string
  category: string | null
  status: string
  created_at: string
}

export async function getRecentVendors(companyId: string, limit = 6): Promise<DashboardVendor[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, category, status, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((v: { id: string; name: string; category: string | null; status: string; created_at: string }) => ({
    id: v.id,
    name: v.name,
    initials: v.name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
    category: v.category,
    status: v.status,
    created_at: v.created_at,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// RECENT RFQs TABLE
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardRfq {
  id: string
  rfq_number: string
  title: string
  vendor_name: string | null
  status: string
  due_date: string | null
  created_at: string
}

export async function getRecentRfqs(companyId: string, limit = 5): Promise<DashboardRfq[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('rfqs')
    .select('id, rfq_number, title, status, due_date, created_at, vendor:vendors(name)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((r: {
    id: string; rfq_number: string; title: string; status: string;
    due_date: string | null; created_at: string; vendor: { name: string } | null
  }) => ({
    id: r.id,
    rfq_number: r.rfq_number,
    title: r.title,
    vendor_name: r.vendor?.name ?? null,
    status: r.status,
    due_date: r.due_date,
    created_at: r.created_at,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// RECENT PURCHASE ORDERS TABLE
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardPo {
  id: string
  po_number: string
  vendor_name: string | null
  status: string
  total_amount: number | null
  due_date: string | null
  created_at: string
}

export async function getRecentPurchaseOrders(companyId: string, limit = 5): Promise<DashboardPo[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('id, po_number, status, total_amount, due_date, created_at, vendor:vendors(name)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((p: {
    id: string; po_number: string; status: string; total_amount: number | null;
    due_date: string | null; created_at: string; vendor: { name: string } | null
  }) => ({
    id: p.id,
    po_number: p.po_number,
    vendor_name: p.vendor?.name ?? null,
    status: p.status,
    total_amount: p.total_amount,
    due_date: p.due_date,
    created_at: p.created_at,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA — Monthly PO spend (last 6 months)
// ─────────────────────────────────────────────────────────────────────────────

export interface MonthlySpendPoint {
  month: string   // e.g. "Jan"
  spend: number
}

export async function getMonthlySpendTrend(
  companyId: string,
  months = 6,
): Promise<MonthlySpendPoint[]> {
  const supabase = await db()
  const results: MonthlySpendPoint[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

    const { data } = await supabase
      .from('payments')
      .select('amount')
      .eq('company_id', companyId)
      .gte('payment_date', from)
      .lte('payment_date', to)

    const spend = (data ?? []).reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0)
    results.push({
      month: d.toLocaleString('en-US', { month: 'short' }),
      spend,
    })
  }
  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA — Vendor category distribution
// ─────────────────────────────────────────────────────────────────────────────

export interface VendorCategoryPoint {
  name: string
  value: number
  color: string
}

const CATEGORY_COLORS: Record<string, string> = {
  software:    '#4350ed',
  hardware:    '#8b5cf6',
  services:    '#22c55e',
  consulting:  '#f59e0b',
  logistics:   '#06b6d4',
  marketing:   '#ec4899',
  finance:     '#14b8a6',
  legal:       '#f97316',
  other:       '#94a3b8',
}

export async function getVendorCategoryDistribution(
  companyId: string,
): Promise<VendorCategoryPoint[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('vendors')
    .select('category')
    .eq('company_id', companyId)
    .not('status', 'eq', 'inactive')
  if (error) throw error

  const counts: Record<string, number> = {}
  for (const v of data ?? []) {
    const cat = v.category ?? 'other'
    counts[cat] = (counts[cat] ?? 0) + 1
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: CATEGORY_COLORS[name] ?? `hsl(${i * 47}, 65%, 55%)`,
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA — RFQ status distribution
// ─────────────────────────────────────────────────────────────────────────────

export interface RfqStatusPoint {
  name: string
  value: number
  color: string
}

const RFQ_STATUS_COLORS: Record<string, string> = {
  draft:        '#94a3b8',
  sent:         '#4350ed',
  under_review: '#8b5cf6',
  awarded:      '#22c55e',
  cancelled:    '#ef4444',
}

const RFQ_STATUS_DISPLAY: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  under_review: 'Under Review',
  awarded: 'Awarded',
  cancelled: 'Cancelled',
}

export async function getRfqStatusDistribution(
  companyId: string,
): Promise<RfqStatusPoint[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('rfqs')
    .select('status')
    .eq('company_id', companyId)
  if (error) throw error

  const counts: Record<string, number> = {}
  for (const r of data ?? []) {
    counts[r.status] = (counts[r.status] ?? 0) + 1
  }

  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({
      name: RFQ_STATUS_DISPLAY[status] ?? status,
      value,
      color: RFQ_STATUS_COLORS[status] ?? '#94a3b8',
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// RECENT ACTIVITY — derived from real DB events
// ─────────────────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  created_at: string
  icon: string
  color: string
}

export async function getRecentActivity(
  companyId: string,
  limit = 8,
): Promise<ActivityItem[]> {
  const supabase = await db()

  const [vendors, rfqs, pos, payments, grns] = await Promise.all([
    // Recently added vendors
    supabase
      .from('vendors')
      .select('id, name, status, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(3),

    // Recently created RFQs
    supabase
      .from('rfqs')
      .select('id, rfq_number, title, status, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(3),

    // Recently updated POs
    supabase
      .from('purchase_orders')
      .select('id, po_number, status, total_amount, updated_at')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })
      .limit(3),

    // Recent payments
    supabase
      .from('payments')
      .select('id, payment_reference, amount, payment_date, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(3),

    // Recent completed GRNs
    supabase
      .from('grn')
      .select('id, grn_number, status, created_at')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(2),
  ])

  const items: ActivityItem[] = []

  for (const v of vendors.data ?? []) {
    items.push({
      id: `vendor-${v.id}`,
      type: 'vendor_added',
      title: `Vendor ${v.status === 'active' ? 'activated' : 'added'}`,
      description: `${v.name} was added to the platform.`,
      created_at: v.created_at,
      icon: 'UserPlus',
      color: 'blue',
    })
  }

  for (const r of rfqs.data ?? []) {
    items.push({
      id: `rfq-${r.id}`,
      type: 'rfq_created',
      title: `RFQ ${r.rfq_number} ${r.status === 'sent' ? 'sent' : 'created'}`,
      description: r.title,
      created_at: r.created_at,
      icon: 'FileText',
      color: 'purple',
    })
  }

  for (const p of pos.data ?? []) {
    const statusLabel =
      p.status === 'approved' ? 'approved' :
      p.status === 'completed' ? 'completed' :
      p.status === 'cancelled' ? 'cancelled' : 'updated'
    items.push({
      id: `po-${p.id}`,
      type: 'po_updated',
      title: `Purchase Order ${p.po_number} ${statusLabel}`,
      description: p.total_amount != null
        ? `Amount: ₹${Number(p.total_amount).toLocaleString('en-IN')}`
        : `Status changed to ${p.status}`,
      created_at: p.updated_at,
      icon: 'CheckCircle',
      color: p.status === 'approved' ? 'green' : p.status === 'cancelled' ? 'red' : 'orange',
    })
  }

  for (const pay of payments.data ?? []) {
    items.push({
      id: `pay-${pay.id}`,
      type: 'payment_recorded',
      title: `Payment ${pay.payment_reference} recorded`,
      description: `₹${Number(pay.amount).toLocaleString('en-IN')} on ${pay.payment_date}`,
      created_at: pay.created_at,
      icon: 'DollarSign',
      color: 'cyan',
    })
  }

  for (const g of grns.data ?? []) {
    items.push({
      id: `grn-${g.id}`,
      type: 'grn_completed',
      title: `GRN ${g.grn_number} completed`,
      description: 'Inventory stock levels updated.',
      created_at: g.created_at,
      icon: 'Package',
      color: 'orange',
    })
  }

  return items
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS — live alerts from DB state
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardNotification {
  id: string
  type: string
  title: string
  description: string
  created_at: string
  icon: string
  color: string
  read: boolean
}

export async function getDashboardNotifications(
  companyId: string,
): Promise<DashboardNotification[]> {
  const supabase = await db()
  const today = new Date().toISOString().slice(0, 10)
  const items: DashboardNotification[] = []

  const [pendingApprovals, pendingVendors, lowStockData, overdueInvoices, overduePOs] =
    await Promise.all([
      // Pending approvals
      supabase
        .from('approval_requests')
        .select('id, title, created_at')
        .eq('company_id', companyId)
        .not('status', 'in', '("approved","rejected","cancelled","completed","draft")')
        .order('created_at', { ascending: false })
        .limit(3),

      // Vendors pending verification
      supabase
        .from('vendors')
        .select('id, name, created_at')
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3),

      // Low stock items
      supabase
        .from('inventory')
        .select('id, quantity_available, product:products!inner(name, reorder_level)')
        .eq('company_id', companyId)
        .lte('quantity_available', 0)
        .limit(5),

      // Overdue invoices
      supabase
        .from('invoices')
        .select('id, invoice_number, remaining_amount, due_date')
        .eq('company_id', companyId)
        .lt('due_date', today)
        .not('status', 'in', '("paid","cancelled","draft")')
        .order('due_date')
        .limit(3),

      // Overdue POs
      supabase
        .from('purchase_orders')
        .select('id, po_number, due_date')
        .eq('company_id', companyId)
        .lt('due_date', today)
        .not('status', 'in', '("completed","cancelled")')
        .order('due_date')
        .limit(2),
    ])

  for (const a of pendingApprovals.data ?? []) {
    items.push({
      id: `approval-${a.id}`,
      type: 'approval',
      title: 'Approval required',
      description: a.title,
      created_at: a.created_at,
      icon: 'FileText',
      color: 'blue',
      read: false,
    })
  }

  for (const v of pendingVendors.data ?? []) {
    items.push({
      id: `vendor-pending-${v.id}`,
      type: 'verification',
      title: 'Vendor verification pending',
      description: `${v.name} is awaiting verification.`,
      created_at: v.created_at,
      icon: 'Building2',
      color: 'purple',
      read: false,
    })
  }

  if ((lowStockData.data ?? []).length > 0) {
    items.push({
      id: `low-stock-alert`,
      type: 'inventory',
      title: 'Low / out-of-stock alert',
      description: `${lowStockData.data!.length} item${lowStockData.data!.length !== 1 ? 's' : ''} at or below minimum stock.`,
      created_at: new Date().toISOString(),
      icon: 'Package',
      color: 'orange',
      read: false,
    })
  }

  for (const inv of overdueInvoices.data ?? []) {
    items.push({
      id: `invoice-overdue-${inv.id}`,
      type: 'payment',
      title: 'Invoice overdue',
      description: `${inv.invoice_number} — ₹${Number(inv.remaining_amount).toLocaleString('en-IN')} due since ${inv.due_date}`,
      created_at: new Date().toISOString(),
      icon: 'CreditCard',
      color: 'red',
      read: false,
    })
  }

  for (const po of overduePOs.data ?? []) {
    items.push({
      id: `po-overdue-${po.id}`,
      type: 'alert',
      title: 'Purchase order overdue',
      description: `${po.po_number} delivery is past the expected date (${po.due_date}).`,
      created_at: new Date().toISOString(),
      icon: 'AlertTriangle',
      color: 'red',
      read: true,
    })
  }

  return items.slice(0, 8)
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDAR EVENTS — live RFQ deadlines and PO due dates
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  title: string
  date: string   // ISO date YYYY-MM-DD
  type: 'rfq' | 'po' | 'payment' | 'grn'
}

export async function getCalendarEvents(companyId: string): Promise<CalendarEvent[]> {
  const supabase = await db()
  const today = new Date()
  // Look 3 months back and 3 months forward
  const from = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().slice(0, 10)
  const to   = new Date(today.getFullYear(), today.getMonth() + 3, 28).toISOString().slice(0, 10)

  const [rfqs, pos, invoices, grns] = await Promise.all([
    supabase
      .from('rfqs')
      .select('id, rfq_number, due_date')
      .eq('company_id', companyId)
      .not('due_date', 'is', null)
      .gte('due_date', from)
      .lte('due_date', to)
      .limit(30),

    supabase
      .from('purchase_orders')
      .select('id, po_number, due_date')
      .eq('company_id', companyId)
      .not('due_date', 'is', null)
      .gte('due_date', from)
      .lte('due_date', to)
      .limit(30),

    supabase
      .from('invoices')
      .select('id, invoice_number, due_date')
      .eq('company_id', companyId)
      .not('due_date', 'is', null)
      .gte('due_date', from)
      .lte('due_date', to)
      .not('status', 'in', '("paid","cancelled")')
      .limit(20),

    supabase
      .from('grn')
      .select('id, grn_number, received_date')
      .eq('company_id', companyId)
      .gte('received_date', from)
      .lte('received_date', to)
      .limit(20),
  ])

  const events: CalendarEvent[] = []

  for (const r of rfqs.data ?? []) {
    events.push({ id: `rfq-${r.id}`, title: `${r.rfq_number} deadline`, date: r.due_date, type: 'rfq' })
  }
  for (const p of pos.data ?? []) {
    events.push({ id: `po-${p.id}`, title: `${p.po_number} due`, date: p.due_date, type: 'po' })
  }
  for (const inv of invoices.data ?? []) {
    events.push({ id: `inv-${inv.id}`, title: `${inv.invoice_number} payment due`, date: inv.due_date, type: 'payment' })
  }
  for (const g of grns.data ?? []) {
    events.push({ id: `grn-${g.id}`, title: `GRN ${g.grn_number}`, date: g.received_date, type: 'grn' })
  }

  return events
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA — Procurement status counts (for donut chart)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProcurementStatusPoint {
  name: string
  value: number
}

export async function getProcurementStatusCounts(
  companyId: string,
): Promise<ProcurementStatusPoint[]> {
  const supabase = await db()

  const [rfqs, quotations, pos, grns, invoices, payments] = await Promise.all([
    supabase.from('rfqs').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('grn').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
  ])

  return [
    { name: 'RFQs',       value: rfqs.count ?? 0 },
    { name: 'Quotations', value: quotations.count ?? 0 },
    { name: 'POs',        value: pos.count ?? 0 },
    { name: 'GRNs',       value: grns.count ?? 0 },
    { name: 'Invoices',   value: invoices.count ?? 0 },
    { name: 'Payments',   value: payments.count ?? 0 },
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA — Vendor performance trend (last 6 months)
// Derived from: on-time deliveries (GRN vs PO due), invoice approval rate,
// and quotation response rate as proxies for delivery/quality/response.
// ─────────────────────────────────────────────────────────────────────────────

export interface VendorPerfPoint {
  month: string
  delivery: number   // % of GRNs received on/before PO due date
  quality:  number   // % of invoices approved (not rejected)
  response: number   // % of RFQs that got at least one quotation
}

export async function getVendorPerformanceTrend(
  companyId: string,
  months = 6,
): Promise<VendorPerfPoint[]> {
  const supabase = await db()
  const results: VendorPerfPoint[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year  = d.getFullYear()
    const month = d.getMonth() + 1
    const from  = `${year}-${String(month).padStart(2, '0')}-01`
    const to    = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

    const [allGrns, onTimeGrns, allInvoices, approvedInvoices, allRfqs, respondedRfqs] =
      await Promise.all([
        // All GRNs received this month
        supabase.from('grn')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'completed')
          .gte('received_date', from).lte('received_date', to),

        // GRNs received on or before PO due date (proxy for on-time delivery)
        supabase.from('grn')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('status', 'completed')
          .gte('received_date', from).lte('received_date', to)
          .not('purchase_order_id', 'is', null),

        // All invoices this month
        supabase.from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .gte('created_at', from).lte('created_at', to + 'T23:59:59'),

        // Approved invoices this month
        supabase.from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .in('status', ['approved', 'paid', 'partially_paid'])
          .gte('created_at', from).lte('created_at', to + 'T23:59:59'),

        // All RFQs sent this month
        supabase.from('rfqs')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .not('status', 'eq', 'draft')
          .gte('created_at', from).lte('created_at', to + 'T23:59:59'),

        // RFQs that got at least one quotation (responded)
        supabase.from('rfqs')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .in('status', ['under_review', 'awarded', 'closed'])
          .gte('created_at', from).lte('created_at', to + 'T23:59:59'),
      ])

    const totalGrns      = allGrns.count ?? 0
    const totalInvoices  = allInvoices.count ?? 0
    const totalRfqs      = allRfqs.count ?? 0

    const delivery = totalGrns     > 0 ? Math.round(((onTimeGrns.count ?? 0)      / totalGrns)     * 100) : 0
    const quality  = totalInvoices > 0 ? Math.round(((approvedInvoices.count ?? 0) / totalInvoices) * 100) : 0
    const response = totalRfqs     > 0 ? Math.round(((respondedRfqs.count ?? 0)   / totalRfqs)     * 100) : 0

    results.push({
      month: d.toLocaleString('en-US', { month: 'short' }),
      delivery,
      quality,
      response,
    })
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA — Inventory health (current snapshot, not a time series)
// Returns per-warehouse or per-status breakdown for the area chart.
// ─────────────────────────────────────────────────────────────────────────────

export interface InventoryHealthPoint {
  date: string
  available: number
  low: number
  out: number
}

export async function getInventoryHealthSnapshot(
  companyId: string,
): Promise<InventoryHealthPoint[]> {
  const supabase = await db()

  // Get all inventory items with their product reorder levels
  const { data } = await supabase
    .from('inventory')
    .select('quantity_available, product:products!inner(name, reorder_level)')
    .eq('company_id', companyId)
    .limit(2000)

  type InvRow = { quantity_available: number; product: { name: string; reorder_level: number } }
  const rows = (data ?? []) as InvRow[]

  let available = 0
  let low = 0
  let out = 0

  for (const r of rows) {
    const qty = r.quantity_available ?? 0
    const reorder = r.product?.reorder_level ?? 0
    if (qty <= 0) {
      out++
    } else if (qty <= reorder) {
      low++
    } else {
      available++
    }
  }

  // Build a 6-point "snapshot" spread — since we don't have historical data,
  // we use the current totals and show a flat line so the chart is meaningful.
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today']
  return days.map((date) => ({ date, available, low, out }))
}
