'use client'

import Link from 'next/link'

type Status = 'approved' | 'pending' | 'sent' | 'rejected' | 'completed' | 'draft' | 'submitted' | string

const STATUS_PILL: Record<Status, { label: string; bg: string; color: string }> = {
  approved:  { label: 'Approved',  bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  completed: { label: 'Completed', bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  sent:      { label: 'Sent',      bg: 'rgba(6,182,212,0.15)',   color: '#22d3ee' },
  acknowledged:{ label: 'Acknowledged', bg: 'rgba(20,184,166,0.15)', color: '#2dd4bf' },
  in_progress:{ label: 'In Progress', bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
  pending:   { label: 'Pending',   bg: 'rgba(250,204,21,0.15)',  color: '#fbbf24' },
  pending_approval:{ label: 'Pending', bg: 'rgba(250,204,21,0.15)', color: '#fbbf24' },
  draft:     { label: 'Draft',     bg: 'rgba(124,143,166,0.15)', color: '#94a3b8' },
  submitted: { label: 'Submitted', bg: 'rgba(167,139,250,0.15)', color: '#c4b5fd' },
  rejected:  { label: 'Rejected',  bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
}

interface PORow {
  id: string
  po_number: string
  status: string
  total_amount: number | null
  created_at: string
  vendor: { name: string } | null
}

export function GlassRecentTableClient({ rows }: { rows: PORow[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top reflection */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          Recent Purchase Orders
        </h3>
        <Link href="/purchase-orders" className="text-[11px] font-medium" style={{ color: '#4F8CFF' }}>
          View all →
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-white/25">No purchase orders yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['PO Number', 'Vendor', 'Amount', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left font-semibold"
                    style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', fontSize: '10px', textTransform: 'uppercase' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const pill = STATUS_PILL[row.status] ?? STATUS_PILL.draft
                return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/purchase-orders/${row.id}`}
                        className="font-semibold hover:underline"
                        style={{ color: '#4F8CFF' }}
                      >
                        {row.po_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {row.vendor?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {row.total_amount != null
                        ? `₹${Number(row.total_amount).toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                        style={{ background: pill.bg, color: pill.color }}
                      >
                        {pill.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
