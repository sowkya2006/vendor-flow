import { getDashboardKpis } from '@/lib/supabase/dashboard'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { GlassKpiCard } from './glass-kpi-card'
import {
  Users, FileText, ShoppingCart, Clock, DollarSign, AlertTriangle,
  Package, TrendingUp, Truck, FileCheck,
} from 'lucide-react'

const CARD_CONFIGS = [
  {
    key: 'total_vendors',
    title: 'Total Vendors',
    description: 'Active vendor relationships',
    icon: <Users className="h-5 w-5 text-blue-400" />,
    gradient: 'from-blue-600/20 to-blue-800/5',
    glowColor: 'rgba(59,130,246,0.25)',
    borderColor: 'rgba(59,130,246,0.25)',
  },
  {
    key: 'active_rfqs',
    title: 'Active RFQs',
    description: 'Requests for quotation in progress',
    icon: <FileText className="h-5 w-5 text-purple-400" />,
    gradient: 'from-purple-600/20 to-purple-800/5',
    glowColor: 'rgba(139,92,246,0.25)',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  {
    key: 'total_purchase_orders',
    title: 'Purchase Orders',
    description: 'Total purchase orders',
    icon: <ShoppingCart className="h-5 w-5 text-emerald-400" />,
    gradient: 'from-emerald-600/20 to-emerald-800/5',
    glowColor: 'rgba(34,197,94,0.25)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  {
    key: 'pending_approvals',
    title: 'Pending Approvals',
    description: 'Items awaiting review',
    icon: <Clock className="h-5 w-5 text-amber-400" />,
    gradient: 'from-amber-600/20 to-amber-800/5',
    glowColor: 'rgba(245,158,11,0.25)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  {
    key: 'monthly_spend',
    title: 'Monthly Spend',
    description: 'Payments recorded this month',
    icon: <DollarSign className="h-5 w-5 text-cyan-400" />,
    gradient: 'from-cyan-600/20 to-cyan-800/5',
    glowColor: 'rgba(6,182,212,0.25)',
    borderColor: 'rgba(6,182,212,0.25)',
    isCurrency: true,
  },
  {
    key: 'inventory_alerts',
    title: 'Inventory Alerts',
    description: 'Items at or below reorder point',
    icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
    gradient: 'from-red-600/20 to-red-800/5',
    glowColor: 'rgba(239,68,68,0.25)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
] as const

type KpiKey = 'total_vendors' | 'active_rfqs' | 'total_purchase_orders' | 'pending_approvals' | 'monthly_spend' | 'inventory_alerts'

export async function GlassKpiGrid() {
  let kpis: Record<KpiKey, number> = {
    total_vendors: 0,
    active_rfqs: 0,
    total_purchase_orders: 0,
    pending_approvals: 0,
    monthly_spend: 0,
    inventory_alerts: 0,
  }

  try {
    const companyId = await getCompanyId()
    const data = await getDashboardKpis(companyId)
    kpis = data as typeof kpis
  } catch { /* safe fallback */ }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARD_CONFIGS.map((cfg, i) => (
        <GlassKpiCard
          key={cfg.key}
          title={cfg.title}
          value={kpis[cfg.key as KpiKey] ?? 0}
          description={cfg.description}
          icon={cfg.icon}
          gradient={cfg.gradient}
          glowColor={cfg.glowColor}
          borderColor={cfg.borderColor}
          isCurrency={'isCurrency' in cfg ? cfg.isCurrency : false}
          index={i}
        />
      ))}
    </div>
  )
}
