import { KpiCard } from './kpi-card'
import { getDashboardKpis } from '@/lib/supabase/dashboard'
import { getCompanyId } from '@/lib/supabase/get-company-id'

export async function KpiGrid() {
  let kpis
  try {
    const companyId = await getCompanyId()
    kpis = await getDashboardKpis(companyId)
  } catch {
    kpis = {
      total_vendors: 0,
      active_rfqs: 0,
      total_purchase_orders: 0,
      pending_approvals: 0,
      monthly_spend: 0,
      inventory_alerts: 0,
    }
  }

  const cards = [
    {
      id: 'total-vendors',
      title: 'Total Vendors',
      value: kpis.total_vendors,
      change: 0,
      trend: 'up' as const,
      icon: 'Users',
      color: 'blue',
      description: 'Active vendor relationships',
    },
    {
      id: 'active-rfqs',
      title: 'Active RFQs',
      value: kpis.active_rfqs,
      change: 0,
      trend: 'up' as const,
      icon: 'FileText',
      color: 'purple',
      description: 'Requests for quotation in progress',
    },
    {
      id: 'purchase-orders',
      title: 'Purchase Orders',
      value: kpis.total_purchase_orders,
      change: 0,
      trend: 'up' as const,
      icon: 'ShoppingCart',
      color: 'green',
      description: 'Total purchase orders',
    },
    {
      id: 'pending-approvals',
      title: 'Pending Approvals',
      value: kpis.pending_approvals,
      change: 0,
      trend: kpis.pending_approvals > 0 ? 'up' as const : 'down' as const,
      icon: 'Clock',
      color: 'orange',
      description: 'Items awaiting review',
    },
    {
      id: 'monthly-spend',
      title: 'Monthly Spend',
      value: kpis.monthly_spend,
      change: 0,
      trend: 'up' as const,
      icon: 'DollarSign',
      color: 'cyan',
      description: 'Payments recorded this month',
      isCurrency: true,
    },
    {
      id: 'inventory-alerts',
      title: 'Inventory Alerts',
      value: kpis.inventory_alerts,
      change: 0,
      trend: kpis.inventory_alerts > 0 ? 'up' as const : 'down' as const,
      icon: 'AlertTriangle',
      color: 'red',
      description: 'Items at or below reorder point',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((kpi, i) => (
        <KpiCard key={kpi.id} {...kpi} index={i} />
      ))}
    </div>
  )
}
