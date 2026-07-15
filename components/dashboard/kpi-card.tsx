'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown,
  Users, FileText, ShoppingCart, Clock,
  DollarSign, AlertTriangle, Package, CreditCard,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  Users, FileText, ShoppingCart, Clock,
  DollarSign, AlertTriangle, Package, CreditCard,
}

const colorMap: Record<string, { stripe: string; bg: string; iconColor: string }> = {
  blue:   { stripe: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/40',    iconColor: 'text-blue-600 dark:text-blue-400'   },
  purple: { stripe: 'bg-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950/40', iconColor: 'text-violet-600 dark:text-violet-400' },
  green:  { stripe: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  orange: { stripe: 'bg-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-600 dark:text-orange-400' },
  cyan:   { stripe: 'bg-cyan-500',    bg: 'bg-cyan-50 dark:bg-cyan-950/40',    iconColor: 'text-cyan-600 dark:text-cyan-400'   },
  red:    { stripe: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-950/40',      iconColor: 'text-red-600 dark:text-red-400'     },
}

function useAnimatedCounter(target: number, duration = 1100) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  useEffect(() => {
    startRef.current = null
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * target))
      if (p < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])
  return count
}

export interface KpiCardProps {
  id: string
  title: string
  value: number
  change: number
  trend: 'up' | 'down'
  icon: string
  color: string
  description: string
  isCurrency?: boolean
  index?: number
}

export function KpiCard({ title, value, change, trend, icon, color, description, isCurrency, index = 0 }: KpiCardProps) {
  const animated = useAnimatedCounter(value, 1000 + index * 70)
  const colors = colorMap[color] ?? colorMap.blue
  const Icon = iconMap[icon] ?? Users
  const isUp = trend === 'up'

  const displayValue = isCurrency
    ? `₹${animated >= 100000 ? `${(animated / 100000).toFixed(1)}L` : animated >= 1000 ? `${(animated / 1000).toFixed(0)}K` : animated}`
    : animated.toLocaleString('en-IN')

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.16 } }}
      className="group relative overflow-hidden rounded-xl border border-[--color-border] bg-[--color-card] shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
    >
      {/* Left accent stripe */}
      <div className={cn('absolute inset-y-0 left-0 w-[3px]', colors.stripe)} />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[--color-foreground-muted]">
              {title}
            </p>
            <p className="mt-2 text-[28px] font-bold tabular-nums leading-none tracking-tight text-[--color-foreground]">
              {displayValue}
            </p>
            <p className="mt-1.5 text-xs text-[--color-foreground-subtle] truncate">{description}</p>
          </div>
          <div className={cn('shrink-0 rounded-xl p-2.5 mt-0.5', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.iconColor)} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            isUp
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
          )}>
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isUp ? '+' : ''}{change}%
          </span>
          <span className="text-[11px] text-[--color-foreground-subtle]">vs last month</span>
        </div>
      </div>
    </motion.div>
  )
}
