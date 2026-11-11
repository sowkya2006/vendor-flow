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
    icon: <Users className="h-5 w-5" style={{ color: '#8B9FE8' }} />,
    gradient: 'from-[rgba(139,159,232,0.18)] to-[rgba(139,159,232,0.04)]',
    glowColor: 'rgba(139,159,232,0.30)',
    borderColor: 'rgba(139,159,232,0.30)',
  },
  {
    key: 'active_rfqs',
    title: 'Active RFQs',
    description: 'Requests for quotation in progress',
    icon: <FileText className="h-5 w-5" style={{ color: '#A78BFA' }} />,
    gradient: 'from-[rgba(167,139,250,0.18)] to-[rgba(167,139,250,0.04)]',
    glowColor: 'rgba(167,139,250,0.30)',
    borderColor: 'rgba(167,139,250,0.30)',
  },
  {
    key: 'total_purchase_orders',
    title: 'Purchase Orders',
    description: 'Total purchase orders',
    icon: <ShoppingCart className="h-5 w-5" style={{ color: '#34D399' }} />,
    gradient: 'from-[rgba(52,211,153,0.18)] to-[rgba(52,211,153,0.04)]',
    glowColor: 'rgba(52,211,153,0.28)',
    borderColor: 'rgba(52,211,153,0.28)',
  },
  {
    key: 'pending_approvals',
    title: 'Pending Approvals',
    description: 'Items awaiting review',
    icon: <Clock className="h-5 w-5" style={{ color: '#C9A84C' }} />,
    gradient: 'from-[rgba(201,168,76,0.18)] to-[rgba(201,168,76,0.04)]',
    glowColor: 'rgba(201,168,76,0.28)',
    borderColor: 'rgba(201,168,76,0.28)',
  },
  {
    key: 'monthly_spend',
    title: 'Monthly Spend',
    description: 'Payments recorded this month',
    icon: <DollarSign className="h-5 w-5" style={{ color: '#06B6D4' }} />,
    gradient: 'from-[rgba(6,182,212,0.18)] to-[rgba(6,182,212,0.04)]',
    glowColor: 'rgba(6,182,212,0.28)',
    borderColor: 'rgba(6,182,212,0.28)',
    isCurrency: true,
  },
  {
    key: 'inventory_alerts',
    title: 'Inventory Alerts',
    description: 'Items at or below reorder point',
    icon: <AlertTriangle className="h-5 w-5" style={{ color: '#F87171' }} />,
    gradient: 'from-[rgba(248,113,113,0.18)] to-[rgba(248,113,113,0.04)]',
    glowColor: 'rgba(248,113,113,0.28)',
    borderColor: 'rgba(248,113,113,0.28)',
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
