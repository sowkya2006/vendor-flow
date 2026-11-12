'use client'

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const TOOLTIP = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.10)',
  borderRadius: '10px',
  padding: '10px 14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
  color: '#374151',
  fontSize: '12px',
}

const CARD = {
  background: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

const AXIS_TICK = { fill: '#94A3B8', fontSize: 11 }
const GRID_STROKE = 'rgba(0,0,0,0.06)'

// ── Sage/terracotta palette for charts ─────────────────────────
const CHART_COLORS = ['#6B8F8A', '#C4846A', '#9BB5B0', '#E8AA8A', '#4A7A75', '#D4967A']

// ── Monthly Spend Bar Chart ────────────────────────────────────
const SPEND_DATA = [
  { month: 'Jan', spend: 0 }, { month: 'Feb', spend: 0 },
  { month: 'Mar', spend: 0 }, { month: 'Apr', spend: 0 },
  { month: 'May', spend: 0 }, { month: 'Jun', spend: 0 },
]

export function GlassSpendChart({ data = SPEND_DATA }: { data?: typeof SPEND_DATA }) {
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#2D3748]">Monthly Procurement Spend</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">Last 6 months</p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{ background: 'rgba(107,143,138,0.12)', color: '#3D7A74', border: '1px solid rgba(107,143,138,0.25)' }}>
          Monthly
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={24}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6B8F8A" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#9BB5B0" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false}
            tickFormatter={(v) => v === 0 ? '₹0' : `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip contentStyle={TOOLTIP} />
          <Bar dataKey="spend" fill="url(#spendGrad)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Procurement Status Donut ───────────────────────────────────
interface DonutItem { name: string; value: number }
const DEFAULT_DONUT: DonutItem[] = [
  { name: 'RFQs', value: 0 }, { name: 'Quotations', value: 0 },
  { name: 'POs',  value: 0 }, { name: 'GRNs',       value: 0 },
  { name: 'Invoices', value: 0 }, { name: 'Payments', value: 0 },
]

export function GlassProcurementDonut({ data = DEFAULT_DONUT }: { data?: DonutItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#2D3748]">Procurement Status</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">Distribution across modules</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={total > 0 ? data : [{ name: 'No data', value: 1 }]}
                cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                {(total > 0 ? data : [{ name: 'No data', value: 1 }]).map((_, i) => (
                  <Cell key={i} fill={total > 0 ? CHART_COLORS[i % CHART_COLORS.length] : '#EDE8E3'} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-bold text-[#2D3748]">{total}</p>
            <p className="text-[10px] text-[#94A3B8]">Total</p>
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-[11px] text-[#64748B] truncate">{d.name}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#2D3748] shrink-0">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Vendor Performance Line Chart ──────────────────────────────
interface VendorPerfData { month: string; delivery: number; quality: number; response: number }
const DEFAULT_VENDOR: VendorPerfData[] = [
  { month: 'Jan', delivery: 0, quality: 0, response: 0 },
  { month: 'Feb', delivery: 0, quality: 0, response: 0 },
  { month: 'Mar', delivery: 0, quality: 0, response: 0 },
  { month: 'Apr', delivery: 0, quality: 0, response: 0 },
  { month: 'May', delivery: 0, quality: 0, response: 0 },
  { month: 'Jun', delivery: 0, quality: 0, response: 0 },
]

export function GlassVendorPerformance({ data = DEFAULT_VENDOR }: { data?: VendorPerfData[] }) {
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#2D3748]">Vendor Performance</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">Delivery · Quality · Response</p>
        </div>
        <div className="flex gap-3 text-[10px]">
          {[['#6B8F8A','Delivery'],['#C4846A','Quality'],['#9BB5B0','Response']].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full" style={{ background: c }} />
              <span className="text-[#94A3B8]">{l}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip contentStyle={TOOLTIP} />
          <Line type="monotone" dataKey="delivery" stroke="#6B8F8A" strokeWidth={2.5} dot={false} strokeLinecap="round" />
          <Line type="monotone" dataKey="quality"  stroke="#C4846A" strokeWidth={2.5} dot={false} strokeLinecap="round" />
          <Line type="monotone" dataKey="response" stroke="#9BB5B0" strokeWidth={2.5} dot={false} strokeLinecap="round" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Inventory Health Area Chart ────────────────────────────────
interface InvHealthData { date: string; available: number; low: number; out: number }
const DEFAULT_INV: InvHealthData[] = [
  { date: 'Mon', available: 0, low: 0, out: 0 },
  { date: 'Tue', available: 0, low: 0, out: 0 },
  { date: 'Wed', available: 0, low: 0, out: 0 },
  { date: 'Thu', available: 0, low: 0, out: 0 },
  { date: 'Fri', available: 0, low: 0, out: 0 },
  { date: 'Sat', available: 0, low: 0, out: 0 },
]

export function GlassInventoryHealth({ data = DEFAULT_INV }: { data?: InvHealthData[] }) {
  return (
    <div className="rounded-2xl p-5" style={CARD}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#2D3748]">Inventory Health</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">Available · Low · Out of Stock</p>
        </div>
        <div className="flex gap-3 text-[10px]">
          {[['#6B8F8A','Available'],['#C4846A','Low'],['#E05252','Out']].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full" style={{ background: c }} />
              <span className="text-[#94A3B8]">{l}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            {[['aGrad','#6B8F8A'],['lGrad','#C4846A'],['oGrad','#E05252']].map(([id, color]) => (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP} />
          <Area type="monotone" dataKey="available" stroke="#6B8F8A" fill="url(#aGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="low"       stroke="#C4846A" fill="url(#lGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="out"       stroke="#E05252" fill="url(#oGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
