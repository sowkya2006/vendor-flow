'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const tooltipStyle = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--color-foreground)',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
}
const labelStyle = { color: 'var(--color-foreground-muted)' }
const cardClass = 'rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]'

function fmtK(value: number) {
  if (value === 0) return '₹0'
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
  return `₹${value}`
}

// ── Bar chart — monthly spend ─────────────────────────────────────────────────
interface SpendPoint { month: string; spend: number }

interface SpendBarChartClientProps { data: SpendPoint[] }

export function SpendBarChartClient({ data }: SpendBarChartClientProps) {
  const isEmpty = data.length === 0 || data.every((d) => d.spend === 0)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={cardClass}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Procurement Spend</h3>
        <p className="text-xs text-[--color-foreground-muted] mt-0.5">Monthly payments recorded</p>
      </div>
      {isEmpty ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-[--color-foreground-muted]">
          No payment data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-foreground-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: 'var(--color-foreground-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [typeof v === 'number' ? formatCurrency(v) : String(v), 'Spend']}
              contentStyle={tooltipStyle}
              labelStyle={labelStyle}
              cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
            />
            <Bar dataKey="spend" name="Spend" fill="#4350ed" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}

// ── Line chart — spend trend ──────────────────────────────────────────────────
export function SpendLineChartClient({ data }: SpendBarChartClientProps) {
  const isEmpty = data.length === 0 || data.every((d) => d.spend === 0)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cardClass}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Monthly Purchase Trend</h3>
        <p className="text-xs text-[--color-foreground-muted] mt-0.5">Payment volume over time</p>
      </div>
      {isEmpty ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-[--color-foreground-muted]">
          No payment data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-foreground-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: 'var(--color-foreground-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [typeof v === 'number' ? formatCurrency(v) : String(v), 'Spend']}
              contentStyle={tooltipStyle}
              labelStyle={labelStyle}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Line
              type="monotone"
              dataKey="spend"
              name="Actual Spend"
              stroke="#4350ed"
              strokeWidth={2}
              dot={{ r: 3, fill: '#4350ed', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  )
}

// ── Donut/Pie chart ────────────────────────────────────────────────────────────
interface DonutEntry { name: string; value: number; color: string }

interface DonutChartClientProps {
  data: DonutEntry[]
  title: string
  subtitle: string
  innerRadius?: number
  delay?: number
}

export function DonutChartClient({ data, title, subtitle, innerRadius = 0, delay = 0.3 }: DonutChartClientProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const isEmpty = total === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cardClass}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">{title}</h3>
        <p className="text-xs text-[--color-foreground-muted] mt-0.5">{subtitle}</p>
      </div>

      {isEmpty ? (
        <div className="flex h-[160px] items-center justify-center text-sm text-[--color-foreground-muted]">
          No data yet
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [
                    typeof v === 'number' ? `${v} (${((v / total) * 100).toFixed(0)}%)` : String(v),
                    '',
                  ]}
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
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
          <ul className="flex-1 space-y-2 min-w-0">
            {data.map((entry) => (
              <li key={entry.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="flex-1 truncate text-xs text-[--color-foreground-muted]">{entry.name}</span>
                <span className="text-xs font-medium tabular-nums text-[--color-foreground]">
                  {((entry.value / total) * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
