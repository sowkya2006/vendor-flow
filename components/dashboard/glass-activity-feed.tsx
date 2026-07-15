import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import {
  UserPlus, FileText, FileCheck, ShoppingCart, ClipboardList,
  CreditCard, CheckCircle2, Package, Bell,
} from 'lucide-react'
import { relativeTime } from '@/lib/supabase/notification-utils'

const MODULE_ICON = {
  vendor: { icon: UserPlus,      color: '#4F8CFF', bg: 'rgba(79,140,255,0.15)'  },
  rfq:    { icon: FileText,      color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)'  },
  quotation:{ icon: FileCheck,   color: '#22C55E', bg: 'rgba(34,197,94,0.15)'   },
  purchase_order:{ icon: ShoppingCart, color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  grn:    { icon: ClipboardList, color: '#06B6D4', bg: 'rgba(6,182,212,0.15)'   },
  invoice:{ icon: CreditCard,    color: '#FACC15', bg: 'rgba(250,204,21,0.15)'  },
  payment:{ icon: CheckCircle2,  color: '#22C55E', bg: 'rgba(34,197,94,0.15)'   },
  inventory:{ icon: Package,     color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  default:{ icon: Bell,          color: '#7C8FA6', bg: 'rgba(124,143,166,0.15)' },
} as const

type ModuleKey = keyof typeof MODULE_ICON

interface ActivityItem {
  id: string
  type: string
  title: string
  body: string
  created_at: string
  entity_type: string | null
}

export async function GlassActivityFeed() {
  let items: ActivityItem[] = []

  try {
    const companyId = await getCompanyId()
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('approval_notifications')
      .select('id, type, title, body, created_at, entity_type')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(8)
    items = (data ?? []) as ActivityItem[]
  } catch { /* safe fallback */ }

  return (
    <div
      className="rounded-2xl p-5 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        Recent Activity
      </h3>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Bell className="h-8 w-8 text-white/10 mb-2" />
          <p className="text-xs text-white/25">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const moduleKey = (item.entity_type ?? 'default') as ModuleKey
            const cfg = MODULE_ICON[moduleKey] ?? MODULE_ICON.default
            const Icon = cfg.icon
            const isLast = i === items.length - 1

            return (
              <div key={item.id} className="relative flex gap-3">
                {/* Timeline connector */}
                {!isLast && (
                  <div className="absolute left-[18px] top-9 bottom-0 w-px"
                    style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)' }} />
                )}

                {/* Icon */}
                <div
                  className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl mt-0.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
                >
                  <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                </div>

                <div className="flex-1 min-w-0 pb-3">
                  <p className="text-xs font-semibold text-white/80 truncate">{item.title}</p>
                  <p className="text-[11px] text-white/35 mt-0.5 line-clamp-1">{item.body}</p>
                  <p className="text-[10px] text-white/20 mt-1">{relativeTime(item.created_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
