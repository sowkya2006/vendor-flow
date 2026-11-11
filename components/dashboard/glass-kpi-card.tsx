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
  gradient: string       // e.g. "from-blue-500/20 to-blue-600/10"
  glowColor: string      // e.g. "rgba(79,140,255,0.25)"
  borderColor: string    // e.g. "rgba(79,140,255,0.3)"
  index?: number
}

function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = performance.now()
    const startVal = 0
    function step(now: number) {
      if (!el) return
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (target - startVal) * eased)
      el.textContent = current.toLocaleString('en-IN')
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
      className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${borderColor}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 0 ${glowColor}`,
        animationDelay: `${index * 80}ms`,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 16px 48px rgba(0,0,0,0.4), 0 0 40px ${glowColor}`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 8px 32px rgba(0,0,0,0.3), 0 0 0 0 ${glowColor}`
      }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 pointer-events-none`} />

      {/* Top reflection line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            {isCurrency && <span className="text-lg font-semibold text-white/70">₹</span>}
            <span
              ref={countRef}
              className="text-3xl font-bold text-white tracking-tight"
            >
              0
            </span>
          </div>
          {description && (
            <p className="mt-1.5 text-xs text-white/40 truncate">{description}</p>
          )}
        </div>

        {/* Icon */}
        <div
          className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${glowColor.replace('0.25', '0.3')}, ${glowColor.replace('0.25', '0.1')})`,
            border: `1px solid ${borderColor}`,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Change indicator */}
      {change !== undefined && change !== 0 && (
        <div className="relative mt-3 flex items-center gap-1.5">
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              trend === 'up'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            }`}
          >
            {trend === 'up'
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change)}% vs last month
          </div>
        </div>
      )}
    </div>
  )
}
