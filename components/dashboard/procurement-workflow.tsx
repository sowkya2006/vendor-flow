'use client'

import { CheckCircle2, Clock, XCircle, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type StepStatus = 'completed' | 'active' | 'pending' | 'rejected'

interface WorkflowStep {
  label: string
  status: StepStatus
  count?: number
}

const STATUS_CONFIG: Record<StepStatus, {
  icon: React.ReactNode
  bg: string
  border: string
  text: string
  dot: string
}> = {
  completed: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.35)',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  active: {
    icon: <Clock className="h-3.5 w-3.5" />,
    bg: 'rgba(79,140,255,0.12)',
    border: 'rgba(79,140,255,0.4)',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  pending: {
    icon: <Clock className="h-3.5 w-3.5" />,
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    text: 'text-white/30',
    dot: 'bg-white/20',
  },
  rejected: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
}

interface Props {
  steps?: WorkflowStep[]
}

const DEFAULT_STEPS: WorkflowStep[] = [
  { label: 'RFQ Created',       status: 'completed' },
  { label: 'Quotation',         status: 'completed' },
  { label: 'Purchase Order',    status: 'completed' },
  { label: 'Vendor Acceptance', status: 'active' },
  { label: 'Delivery',          status: 'pending' },
  { label: 'GRN',               status: 'pending' },
  { label: 'Inventory Updated', status: 'pending' },
  { label: 'Invoice',           status: 'pending' },
  { label: 'Payment',           status: 'pending' },
  { label: 'Completed',         status: 'pending' },
]

export function ProcurementWorkflow({ steps = DEFAULT_STEPS }: Props) {
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
      {/* Top reflection */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
        Procurement Workflow
      </h3>

      <div className="flex flex-col items-center gap-0">
        {steps.map((step, i) => {
          const cfg = STATUS_CONFIG[step.status]
          return (
            <div key={i} className="flex flex-col items-center w-full max-w-[200px]">
              {/* Step */}
              <div
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200',
                  'hover:scale-[1.02]',
                )}
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <span className={cn('shrink-0', cfg.text)}>{cfg.icon}</span>
                <span className={cn('text-xs font-medium flex-1', cfg.text)}>{step.label}</span>
                {step.count !== undefined && (
                  <span
                    className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold', cfg.text)}
                    style={{ background: cfg.bg }}
                  >
                    {step.count}
                  </span>
                )}
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot,
                  step.status === 'active' && 'animate-pulse'
                )} />
              </div>

              {/* Connector */}
              {i < steps.length - 1 && (
                <div className="flex flex-col items-center py-0.5">
                  <div className="w-px h-3 bg-white/10" />
                  <ArrowDown className="h-3 w-3 text-white/15" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
