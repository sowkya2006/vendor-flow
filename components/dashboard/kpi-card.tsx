'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  ShoppingCart,
  Clock,
  DollarSign,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  Users,
  FileText,
  ShoppingCart,
  Clock,
  DollarSign,
  AlertTriangle,
}

const colorMap: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-950/40',   text: 'text-blue-600 dark:text-blue-400',   ring: 'ring-blue-100 dark:ring-blue-900',   icon: 'text-blue-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-100 dark:ring-purple-900', icon: 'text-purple-500' },
  green:  { bg: 'bg-green-50 dark:bg-green-950/40',  text: 'text-green-600 dark:text-green-400',  ring: 'ring-green-100 dark:ring-green-900',  icon: 'text-green-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-100 dark:ring-orange-900', icon: 'text-orange-500' },
  cyan:   { bg: 'bg-cyan-50 dark:bg-cyan-950/40',    text: 'text-cyan-600 dark:text-cyan-400',    ring: 'ring-cyan-100 dark:ring-cyan-900',    icon: 'text-cyan-500' },
  red:    { bg: 'bg-red-50 dark:bg-red-950/40',      text: 'text-red-600 dark:text-red-400',      ring: 'ring-red-100 dark:ring-red-900',      icon: 'text-red-500' },
}

function useAnimatedCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
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

export function KpiCard({
  title,
  value,
  change,
  trend,
  icon,
  color,
  description,
  isCurrency,
  index = 0,
}: KpiCardProps) {
  const animatedValue = useAnimatedCounter(value, 1200 + index * 100)
  const colors = colorMap[color] ?? colorMap.blue
  const Icon = iconMap[icon] ?? Users
  const isPositive = trend === 'up'

  const displayValue = isCurrency
    ? `$${(animatedValue / 1000).toFixed(0)}K`
    : animatedValue.toLocaleString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm] transition-shadow hover:shadow-[--shadow-md]"
    >
      {/* Subtle gradient accent */}
      <div
        className={cn(
          'absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-opacity group-hover:opacity-20',
          colors.bg
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-[--color-foreground-muted]">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[--color-foreground]">
            {displayValue}
          </p>
          <p className="mt-0.5 text-xs text-[--color-foreground-subtle] truncate">{description}</p>
        </div>

        {/* Icon badge */}
        <div className={cn('ml-3 shrink-0 rounded-lg p-2.5 ring-1', colors.bg, colors.ring)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
      </div>

      {/* Trend badge */}
      <div className="mt-3 flex items-center gap-1.5">
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
            isPositive
              ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{isPositive ? '+' : ''}{change}%</span>
        </div>
        <span className="text-xs text-[--color-foreground-subtle]">vs last month</span>
      </div>
    </motion.div>
  )
}
