'use client'

/**
 * ThreeWayMatchPanel — fetches GRN data live from the API on every render.
 * Using a client component ensures we always get fresh DB data regardless
 * of Next.js RSC cache or preview-mode session issues.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, AlertTriangle, ShoppingCart, ClipboardList, FileText, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MatchData {
  invoice: { id: string; number: string; status: string; po_id: string | null }
  po: { id: string; number: string; status: string } | null
  all_grns: Array<{ id: string; grn_number: string; status: string; purchase_order_id: string }>
  completed_grns: Array<{ id: string; grn_number: string; status: string }>
  match_status: 'no_po' | 'no_grn' | 'matched'
}

interface Props {
  invoiceId: string
  invoiceNumber: string
  invoiceTotal: number
  isFinance: boolean
}

export function ThreeWayMatchPanel({ invoiceId, invoiceNumber, invoiceTotal, isFinance }: Props) {
  const [data, setData] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/debug-invoice?invoice_id=${invoiceId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d as MatchData)
        setLoading(false)
      })
      .catch((e) => {
        setError(String(e))
        setLoading(false)
      })
  }, [invoiceId])

  if (loading) {
    return (
      <div className="rounded-xl border border-[--color-border] bg-[--color-background-subtle] p-5 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-[--color-foreground-muted]" />
        <span className="text-sm text-[--color-foreground-muted]">Loading 3-way match data…</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load match data: {error ?? 'Unknown error'}
      </div>
    )
  }

  const { match_status, po, completed_grns, all_grns } = data
  const grn = completed_grns[0] ?? all_grns[0] ?? null
  const isMatched = match_status === 'matched'
  const hasAnyGrn = all_grns.length > 0

  return (
    <div className={cn(
      'rounded-xl border p-5 space-y-4',
      isMatched ? 'border-emerald-200 bg-emerald-50' :
      match_status === 'no_grn' ? 'border-amber-200 bg-amber-50' :
      'border-[--color-border] bg-[--color-background-subtle]',
    )}>
      {/* Header */}
      <div className="flex items-center gap-2">
        {isMatched
          ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
        <h3 className={cn('text-sm font-semibold',
          isMatched ? 'text-emerald-800' :
          match_status === 'no_grn' ? 'text-amber-800' :
          'text-[--color-foreground]'
        )}>
          {isMatched
            ? '3-Way Match: Verified — All documents linked'
            : match_status === 'no_grn'
            ? '3-Way Match: Incomplete — GRN Required Before Approval'
            : '3-Way Match: No Purchase Order Linked'}
        </h3>
      </div>

      {/* Three columns */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* PO */}
        <div className="flex items-start gap-2.5">
          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
            po ? 'bg-emerald-100 text-emerald-600' : 'bg-[--color-muted] text-[--color-foreground-muted]'
          )}>
            <ShoppingCart className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[--color-foreground-muted] mb-0.5">
              Purchase Order
            </p>
            {po ? (
              <>
                <Link href={`/purchase-orders/${po.id}`} className="text-sm font-semibold text-[--color-primary] hover:underline">
                  {po.number}
                </Link>
                <p className="text-xs text-[--color-foreground-muted] mt-0.5">{formatCurrency(invoiceTotal)}</p>
              </>
            ) : (
              <p className="text-sm text-[--color-foreground-subtle]">Not linked</p>
            )}
          </div>
        </div>

        {/* GRN */}
        <div className="flex items-start gap-2.5">
          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
            isMatched ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          )}>
            <ClipboardList className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[--color-foreground-muted] mb-0.5">
              Goods Receipt Note
            </p>
            {grn ? (
              <>
                <Link href={`/inventory/grn/${grn.id}`} className={cn(
                  'text-sm font-semibold hover:underline',
                  grn.status === 'completed' ? 'text-[--color-primary]' : 'text-amber-600'
                )}>
                  {grn.grn_number}
                </Link>
                <p className={cn('text-xs mt-0.5 capitalize font-medium',
                  grn.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                )}>
                  {grn.status}
                  {grn.status !== 'completed' && (
                    <span className="ml-1 font-normal text-amber-500">(must be completed)</span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-amber-600">No GRN found</p>
            )}
            {all_grns.length > 0 && !isMatched && (
              <p className="text-[10px] text-[--color-foreground-muted] mt-0.5">
                {all_grns.length} GRN{all_grns.length !== 1 ? 's' : ''} found for this PO
              </p>
            )}
          </div>
        </div>

        {/* Invoice */}
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[--color-primary]/10 text-[--color-primary]">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[--color-foreground-muted] mb-0.5">
              Invoice
            </p>
            <p className="text-sm font-semibold text-[--color-foreground]">{invoiceNumber}</p>
            <p className="text-xs text-[--color-foreground-muted] mt-0.5">{formatCurrency(invoiceTotal)}</p>
          </div>
        </div>
      </div>

      {/* Blocking message */}
      {match_status === 'no_grn' && isFinance && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-100 px-3.5 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed space-y-1">
            <p>
              <strong>Approval is blocked.</strong>{' '}
              {hasAnyGrn
                ? `GRN ${all_grns[0]?.grn_number} exists for PO ${po?.number} but its status is "${all_grns[0]?.status}". The Warehouse Manager must mark it as Completed.`
                : `No Goods Receipt Note (GRN) found for Purchase Order ${po?.number}. The Warehouse Manager must create and complete a GRN first.`
              }
            </p>
          </div>
        </div>
      )}

      {match_status === 'no_po' && (
        <p className="text-xs text-[--color-foreground-muted]">
          This invoice is not linked to a Purchase Order. Manual verification required.
        </p>
      )}
    </div>
  )
}
