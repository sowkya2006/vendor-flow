import { Suspense } from 'react'
import Link from 'next/link'
import { Warehouse, AlertTriangle, Package, ClipboardList, ArrowRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getInventoryStats } from '@/lib/supabase/inventory'
import { Skeleton } from '@/components/shared/loading-states'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

async function WMDashboardContent() {
  const companyId = await getCompanyId()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const stats = await getInventoryStats(companyId)

  const [pendingDeliveries, recentGrns, lowStockItems] = await Promise.all([
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('company_id', companyId).in('status', ['approved', 'sent', 'acknowledged', 'in_progress']),
    supabase.from('grn').select('id, grn_number, status, received_date, warehouse:warehouses(name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
    supabase.from('inventory').select('quantity_available, product:products!inner(name, sku, reorder_level)').eq('company_id', companyId).gt('quantity_available', 0).limit(500),
  ])

  const lowStock = (lowStockItems.data ?? []).filter(
    (r: { quantity_available: number; product: { reorder_level: number } }) =>
      r.quantity_available <= r.product.reorder_level
  ).slice(0, 5)

  const GRN_STATUS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Warehouse Manager</h1>
          <p className="text-xs text-[--color-foreground-muted]">Receive goods, manage inventory and create GRNs</p>
        </div>
        <Button asChild size="sm">
          <Link href="/inventory/grn/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New GRN</Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/inventory" className="block rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow">
          <p className="text-xs font-medium text-[--color-foreground-muted]">Inventory Value</p>
          <p className="mt-1 text-3xl font-bold text-[--color-primary]">{formatCurrency(stats.total_stock_value)}</p>
        </Link>
        <Link href="/inventory?filter=low_stock" className={cn('block rounded-xl border px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow', stats.low_stock_count > 0 ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10' : 'border-[--color-border] bg-[--color-card]')}>
          <p className="text-xs font-medium text-[--color-foreground-muted]">Low Stock</p>
          <p className={cn('mt-1 text-3xl font-bold', stats.low_stock_count > 0 ? 'text-amber-600' : 'text-[--color-primary]')}>{stats.low_stock_count}</p>
        </Link>
        <Link href="/purchase-orders" className="block rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow">
          <p className="text-xs font-medium text-[--color-foreground-muted]">Pending Deliveries</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">{pendingDeliveries.count ?? 0}</p>
        </Link>
        <Link href="/inventory/grn" className="block rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm] hover:shadow-[--shadow-md] transition-shadow">
          <p className="text-xs font-medium text-[--color-foreground-muted]">GRNs (30d)</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{stats.recent_grn_count}</p>
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent GRNs */}
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
            <div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[--color-foreground-muted]" /><h2 className="text-sm font-semibold text-[--color-foreground]">Recent GRNs</h2></div>
            <Link href="/inventory/grn" className="text-xs text-[--color-primary] hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {(recentGrns.data ?? []).length === 0 ? (
            <div className="py-8 text-center"><p className="text-sm text-[--color-foreground-muted] mb-2">No GRNs yet</p><Button asChild size="sm" variant="outline"><Link href="/inventory/grn/new">Create first GRN</Link></Button></div>
          ) : (
            <ul className="divide-y divide-[--color-border]">
              {(recentGrns.data ?? []).map((grn: { id: string; grn_number: string; status: string; received_date: string; warehouse: { name: string } | null }) => (
                <li key={grn.id}>
                  <Link href={`/inventory/grn/${grn.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[--color-background-subtle] transition-colors">
                    <div className="min-w-0"><p className="text-sm font-medium text-[--color-foreground]">{grn.grn_number}</p><p className="text-xs text-[--color-foreground-muted]">{grn.warehouse?.name ?? '—'} · {formatDate(grn.received_date)}</p></div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', GRN_STATUS[grn.status] ?? 'bg-gray-100 text-gray-600')}>{grn.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low stock alert */}
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><h2 className="text-sm font-semibold text-[--color-foreground]">Low Stock Alerts</h2></div>
            <Link href="/inventory?filter=low_stock" className="text-xs text-[--color-primary] hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="py-8 text-center"><p className="text-sm text-emerald-600 font-medium">✓ All stock levels healthy</p></div>
          ) : (
            <ul className="divide-y divide-[--color-border]">
              {lowStock.map((item: { quantity_available: number; product: { name: string; sku: string; reorder_level: number } }, i: number) => (
                <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0"><p className="text-sm font-medium text-[--color-foreground] truncate">{item.product.name}</p><p className="text-xs text-[--color-foreground-muted]">{item.product.sku}</p></div>
                  <div className="text-right shrink-0"><p className="text-sm font-bold text-amber-600">{item.quantity_available} left</p><p className="text-xs text-[--color-foreground-muted]">reorder at {item.product.reorder_level}</p></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export function WarehouseManagerDashboard() {
  return (
    <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div><div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div></div>}>
      <WMDashboardContent />
    </Suspense>
  )
}
