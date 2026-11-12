'use client'

import { useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface GlassKpiCardProps {
  title: string
  value: number
  isCurrency?: boolean
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  icon: React.ReactNode
  gradient: string
  glowColor: string
  borderColor: string
  index?: number
}

function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = performance.now()
    function step(now: number) {
      if (!el) return
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.round(target * eased).toLocaleString('en-IN')
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return ref
}

export function GlassKpiCard({
  title, value, isCurrency, change, trend = 'neutral',
  description, icon, gradient, glowColor, borderColor, index = 0,
}: GlassKpiCardProps) {
  const countRef = useCountUp(value, 1000 + index * 100)

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md bg-white"
      style={{
        border: `1px solid ${borderColor}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Soft gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40 pointer-events-none`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-[#94A3B8]">{title}</p>
          <div className="flex items-baseline gap-1">
            {isCurrency && <span className="text-lg font-semibold text-[#64748B]">₹</span>}
            <span ref={countRef} className="text-3xl font-bold text-[#2D3748] tracking-tight">0</span>
          </div>
          {description && <p className="mt-1.5 text-xs truncate text-[#94A3B8]">{description}</p>}
        </div>

        {/* Icon */}
        <div
          className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: glowColor.replace('0.25', '0.12').replace('0.30', '0.12'),
            border: `1px solid ${borderColor}`,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Trend badge */}
      {change !== undefined && change !== 0 && (
        <div className="relative mt-3 flex items-center gap-1.5">
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change)}% vs last month
          </div>
        </div>
      )}
    </div>
  )
}
