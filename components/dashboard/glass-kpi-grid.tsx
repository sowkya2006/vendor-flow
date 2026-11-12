import { getDashboardKpis } from '@/lib/supabase/dashboard'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { GlassKpiCard } from './glass-kpi-card'
import { Users, FileText, ShoppingCart, Clock, DollarSign, AlertTriangle } from 'lucide-react'

const CARD_CONFIGS = [
  {
    key: 'total_vendors',
    title: 'Total Vendors',
    description: 'Active vendor relationships',
    icon: <Users className="h-5 w-5" style={{ color: '#6B8F8A' }} />,
    gradient: 'from-[rgba(107,143,138,0.14)] to-transparent',
    glowColor: 'rgba(107,143,138,0.25)',
    borderColor: 'rgba(107,143,138,0.20)',
  },
  {
    key: 'active_rfqs',
    title: 'Active RFQs',
    description: 'Requests for quotation in progress',
    icon: <FileText className="h-5 w-5" style={{ color: '#C4846A' }} />,
    gradient: 'from-[rgba(196,132,106,0.14)] to-transparent',
    glowColor: 'rgba(196,132,106,0.25)',
    borderColor: 'rgba(196,132,106,0.20)',
  },
  {
    key: 'total_purchase_orders',
    title: 'Purchase Orders',
    description: 'Total purchase orders',
    icon: <ShoppingCart className="h-5 w-5" style={{ color: '#5A9EA0' }} />,
    gradient: 'from-[rgba(90,158,160,0.14)] to-transparent',
    glowColor: 'rgba(90,158,160,0.25)',
    borderColor: 'rgba(90,158,160,0.20)',
  },
  {
    key: 'pending_approvals',
    title: 'Pending Approvals',
    description: 'Items awaiting review',
    icon: <Clock className="h-5 w-5" style={{ color: '#B8956A' }} />,
    gradient: 'from-[rgba(184,149,106,0.14)] to-transparent',
    glowColor: 'rgba(184,149,106,0.25)',
    borderColor: 'rgba(184,149,106,0.20)',
  },
  {
    key: 'monthly_spend',
    title: 'Monthly Spend',
    description: 'Payments recorded this month',
    icon: <DollarSign className="h-5 w-5" style={{ color: '#6B8F8A' }} />,
    gradient: 'from-[rgba(107,143,138,0.14)] to-transparent',
    glowColor: 'rgba(107,143,138,0.25)',
    borderColor: 'rgba(107,143,138,0.20)',
    isCurrency: true,
  },
  {
    key: 'inventory_alerts',
    title: 'Inventory Alerts',
    description: 'Items at or below reorder point',
    icon: <AlertTriangle className="h-5 w-5" style={{ color: '#E05252' }} />,
    gradient: 'from-[rgba(224,82,82,0.10)] to-transparent',
    glowColor: 'rgba(224,82,82,0.20)',
    borderColor: 'rgba(224,82,82,0.16)',
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
