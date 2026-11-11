'use client'

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const GLASS_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(22,28,53,0.97)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(180,190,220,0.25)',
  borderRadius: '12px',
  padding: '10px 14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
  color: '#D0D4E8',
  fontSize: '12px',
}

// ── Monthly Spend Bar Chart ────────────────────────────────────
const SPEND_DATA = [
  { month: 'Jan', spend: 0 },
  { month: 'Feb', spend: 0 },
  { month: 'Mar', spend: 0 },
  { month: 'Apr', spend: 0 },
  { month: 'May', spend: 0 },
  { month: 'Jun', spend: 0 },
]

export function GlassSpendChart({ data = SPEND_DATA }: { data?: typeof SPEND_DATA }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(22,28,53,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(139,159,232,0.22)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(139,159,232,0.08)',
      }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[rgba(139,159,232,0.3)] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Monthly Procurement Spend</h3>
          <p className="text-xs text-[#8B96B4] mt-0.5">Last 6 months</p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: 'rgba(139,159,232,0.15)', color: '#A5B6F0', border: '1px solid rgba(139,159,232,0.35)' }}>
          Monthly
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={24}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B9FE8" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#5569D4" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,159,232,0.08)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#8B96B4', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8B96B4', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v === 0 ? '₹0' : `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip contentStyle={GLASS_TOOLTIP_STYLE} />
          <Bar dataKey="spend" fill="url(#spendGrad)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Procurement Status Donut ───────────────────────────────────
const DONUT_COLORS = ['#8B9FE8', '#C9A84C', '#34D399', '#06B6D4', '#F87171', '#A78BFA']

interface DonutItem { name: string; value: number }
const DEFAULT_DONUT: DonutItem[] = [
  { name: 'RFQs',        value: 0 },
  { name: 'Quotations',  value: 0 },
  { name: 'POs',         value: 0 },
  { name: 'GRNs',        value: 0 },
  { name: 'Invoices',    value: 0 },
  { name: 'Payments',    value: 0 },
]

export function GlassProcurementDonut({ data = DEFAULT_DONUT }: { data?: DonutItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(22,28,53,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(139,159,232,0.22)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(139,159,232,0.08)',
      }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[rgba(139,159,232,0.3)] to-transparent pointer-events-none" />
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Procurement Status</h3>
        <p className="text-xs text-[#8B96B4] mt-0.5">Distribution across modules</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={total > 0 ? data : [{ name: 'No data', value: 1 }]} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                {(total > 0 ? data : [{ name: 'No data', value: 1 }]).map((_, i) => (
                  <Cell key={i} fill={total > 0 ? DONUT_COLORS[i % DONUT_COLORS.length] : 'rgba(139,159,232,0.12)'} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={GLASS_TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-bold text-white">{total}</p>
            <p className="text-[10px] text-[#8B96B4]">Total</p>
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                <span className="text-[11px] text-[#D4DAEB] truncate">{d.name}</span>
              </div>
              <span className="text-[11px] font-semibold text-white shrink-0">{d.value}</span>
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
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(22,28,53,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(139,159,232,0.22)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(139,159,232,0.08)',
      }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[rgba(139,159,232,0.3)] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Vendor Performance</h3>
          <p className="text-xs text-[#8B96B4] mt-0.5">Delivery · Quality · Response</p>
        </div>
        <div className="flex gap-3 text-[10px]">
          {[['#8B9FE8','Delivery'],['#34D399','Quality'],['#C9A84C','Response']].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1">
              <span className="h-1.5 w-3 rounded-full" style={{ background: c }} />
              <span className="text-[#D4DAEB]">{l}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,159,232,0.08)" />
          <XAxis dataKey="month" tick={{ fill: '#8B96B4', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8B96B4', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip contentStyle={GLASS_TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="delivery" stroke="#8B9FE8" strokeWidth={2.5} dot={false} strokeLinecap="round" />
          <Line type="monotone" dataKey="quality"  stroke="#34D399" strokeWidth={2.5} dot={false} strokeLinecap="round" />
          <Line type="monotone" dataKey="response" stroke="#C9A84C" strokeWidth={2.5} dot={false} strokeLinecap="round" />
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
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(22,28,53,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(139,159,232,0.22)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(139,159,232,0.08)',
      }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[rgba(139,159,232,0.3)] to-transparent pointer-events-none" />
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Inventory Health</h3>
          <p className="text-xs text-[#8B96B4] mt-0.5">Available · Low · Out of Stock</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data}>
          <defs>
            {[['aGrad','#34D399'],['lGrad','#FBBF24'],['oGrad','#F87171']].map(([id, color]) => (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,159,232,0.08)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#8B96B4', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8B96B4', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={GLASS_TOOLTIP_STYLE} />
          <Area type="monotone" dataKey="available" stroke="#34D399" fill="url(#aGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="low"       stroke="#FBBF24" fill="url(#lGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="out"       stroke="#F87171" fill="url(#oGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
