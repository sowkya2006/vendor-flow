'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const CARD = 'rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[var(--shadow-sm)]'
const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  color: 'var(--color-foreground)',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
  padding: '8px 12px',
}
const AXIS = { fontSize: 11, fill: 'var(--color-foreground-muted)' }
const GRID = 'var(--color-border)'
const PRIMARY = '#5c63f5'

function fmtK(v: number) {
  if (v === 0) return '₹0'
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`
  return `₹${v}`
}

interface SpendPoint { month: string; spend: number }

export function SpendBarChartClient({ data }: { data: SpendPoint[] }) {
  const isEmpty = !data.length || data.every((d) => d.spend === 0)
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className={CARD}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Procurement Spend</h3>
        <p className="mt-0.5 text-xs text-[--color-foreground-muted]">Monthly payments recorded</p>
      </div>
      {isEmpty ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PRIMARY} stopOpacity={1} />
                <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={AXIS} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? formatCurrency(v) : String(v), 'Spend']} contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(92,99,245,0.06)', radius: 4 }} />
            <Bar dataKey="spend" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}

export function SpendLineChartClient({ data }: { data: SpendPoint[] }) {
  const isEmpty = !data.length || data.every((d) => d.spend === 0)
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }} className={CARD}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Purchase Trend</h3>
        <p className="mt-0.5 text-xs text-[--color-foreground-muted]">Payment volume over time</p>
      </div>
      {isEmpty ? (
        <EmptyChart />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={AXIS} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: unknown) => [typeof v === 'number' ? formatCurrency(v) : String(v), 'Spend']} contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="spend" name="Spend" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 3.5, fill: PRIMARY, strokeWidth: 0 }} activeDot={{ r: 5, fill: PRIMARY }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}

interface DonutEntry { name: string; value: number; color: string }
interface DonutChartClientProps { data: DonutEntry[]; title: string; subtitle: string; innerRadius?: number; delay?: number }

export function DonutChartClient({ data, title, subtitle, innerRadius = 0, delay = 0.28 }: DonutChartClientProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className={CARD}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">{title}</h3>
        <p className="mt-0.5 text-xs text-[--color-foreground-muted]">{subtitle}</p>
      </div>
      {total === 0 ? (
        <EmptyChart />
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ResponsiveContainer width={148} height={148}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={66} paddingAngle={innerRadius > 0 ? 3 : 1} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                  {data.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => [`${v} (${total ? (((v as number) / total) * 100).toFixed(0) : 0}%)`, '']} contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            {innerRadius > 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold tabular-nums text-[--color-foreground]">{total}</span>
                <span className="text-[10px] text-[--color-foreground-subtle]">Total</span>
              </div>
            )}
          </div>
          <ul className="min-w-0 flex-1 space-y-2">
            {data.map((e) => (
              <li key={e.name} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                <span className="flex-1 truncate text-xs text-[--color-foreground-muted]">{e.name}</span>
                <span className="text-xs font-semibold tabular-nums text-[--color-foreground]">{total ? ((e.value / total) * 100).toFixed(0) : 0}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

function EmptyChart() {
  return (
    <div className="flex h-[148px] items-center justify-center rounded-lg border border-dashed border-[--color-border] bg-[--color-background-subtle]">
      <p className="text-sm text-[--color-foreground-muted]">No data yet</p>
    </div>
  )
}
