'use client'

import React from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { ChartPoint, TimePoint } from '@/lib/supabase/analytics'

// ── Shared style constants ─────────────────────────────────────────────────────
const TOOLTIP = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--color-foreground)',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
}
const LABEL = { color: 'var(--color-foreground-muted)' }
const TICK = { fontSize: 11, fill: 'var(--color-foreground-muted)' }
const GRID = { strokeDasharray: '3 3', stroke: 'var(--color-border)', vertical: false }
const H = 240

function fmtK(v: number) {
  if (v === 0) return '₹0'
  if (v >= 1000000) return `₹${(v / 1000000).toFixed(1)}M`
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v}`
}

const EMPTY = (msg = 'No data yet') => (
  <div className="flex items-center justify-center text-sm text-[--color-foreground-muted]" style={{ height: H }}>
    {msg}
  </div>
)

// ── Spend line chart ──────────────────────────────────────────────────────────
interface SpendLineProps { data: TimePoint[]; color?: string; label?: string }
export function SpendLineChart({ data, color = '#4350ed', label = 'Spend' }: SpendLineProps) {
  const empty = data.every((d) => d.value === 0)
  if (empty) return EMPTY('No spend data yet')
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtK} tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [typeof v === 'number' ? formatCurrency(v) : v, label]}
          contentStyle={TOOLTIP} labelStyle={LABEL}
        />
        <Line type="monotone" dataKey="value" name={label} stroke={color} strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Count bar chart ───────────────────────────────────────────────────────────
interface CountBarProps { data: TimePoint[]; color?: string; label?: string }
export function CountBarChart({ data, color = '#4350ed', label = 'Count' }: CountBarProps) {
  const empty = data.every((d) => d.value === 0)
  if (empty) return EMPTY('No data yet')
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="month" tick={TICK} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={TICK} axisLine={false} tickLine={false} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [v, label]}
          contentStyle={TOOLTIP} labelStyle={LABEL}
          cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
        />
        <Bar dataKey="value" name={label} fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Donut / Pie chart ─────────────────────────────────────────────────────────
interface DonutProps { data: ChartPoint[]; innerRadius?: number }
export function DonutChart({ data, innerRadius = 50 }: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return EMPTY()
  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={82}
              paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
              {data.map((e, i) => <Cell key={i} fill={e.color ?? '#94a3b8'} stroke="none" />)}
            </Pie>
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [typeof v === 'number' ? `${v} (${((v / total) * 100).toFixed(0)}%)` : v, '']}
              contentStyle={TOOLTIP} labelStyle={LABEL}
            />
          </PieChart>
        </ResponsiveContainer>
        {innerRadius > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-[--color-foreground]">{total}</span>
            <span className="text-[10px] text-[--color-foreground-muted]">Total</span>
          </div>
        )}
      </div>
      <ul className="flex-1 min-w-0 space-y-2">
        {data.map((e) => (
          <li key={e.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: e.color ?? '#94a3b8' }} />
            <span className="flex-1 truncate text-xs text-[--color-foreground-muted]">{e.name}</span>
            <span className="text-xs font-medium tabular-nums text-[--color-foreground]">
              {((e.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Horizontal bar chart (top items) ─────────────────────────────────────────
interface HBarItem { name: string; value: number }
interface HBarProps {
  data: HBarItem[]
  color?: string
  /** How to format displayed values. Default: 'number'. Use 'currency' for monetary amounts. */
  formatter?: 'currency' | 'number'
}
export function HorizontalBarChart({ data, color = '#4350ed', formatter = 'number' }: HBarProps) {
  if (data.length === 0) return EMPTY()
  const max = Math.max(...data.map((d) => d.value), 1)
  const fmt = (v: number) =>
    formatter === 'currency' ? formatCurrency(v) : String(v)
  return (
    <ul className="space-y-3">
      {data.map((item) => (
        <li key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="truncate text-xs text-[--color-foreground]">{item.name}</span>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-[--color-foreground]">
              {fmt(item.value)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[--color-muted] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
