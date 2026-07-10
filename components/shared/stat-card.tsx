import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label?: string
  }
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, description, trend, icon, className }: StatCardProps) {
  const trendPositive = trend && trend.value > 0
  const trendNegative = trend && trend.value < 0
  const trendNeutral = trend && trend.value === 0

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-[--color-muted-foreground]">{title}</p>
            <p className="mt-2 text-2xl font-bold text-[--color-foreground]">{value}</p>
            {trend && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {trendPositive && <TrendingUp className="h-3.5 w-3.5 text-[--color-success]" />}
                {trendNegative && <TrendingDown className="h-3.5 w-3.5 text-[--color-error]" />}
                {trendNeutral && <Minus className="h-3.5 w-3.5 text-[--color-muted-foreground]" />}
                <span
                  className={cn(
                    'font-medium',
                    trendPositive && 'text-[--color-success]',
                    trendNegative && 'text-[--color-error]',
                    trendNeutral && 'text-[--color-muted-foreground]'
                  )}
                >
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                {trend.label && (
                  <span className="text-[--color-muted-foreground]">{trend.label}</span>
                )}
              </div>
            )}
            {description && !trend && (
              <p className="mt-1 text-xs text-[--color-muted-foreground]">{description}</p>
            )}
          </div>
          {icon && (
            <div className="ml-4 rounded-md bg-[--color-primary]/10 p-2 text-[--color-primary]">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
