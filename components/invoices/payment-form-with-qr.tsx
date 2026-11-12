'use client'

/**
 * PaymentFormWithQR — wraps the standard PaymentForm with a QR code panel.
 *
 * Flow:
 * 1. Finance Manager opens Record Payment page
 * 2. QR code is displayed — scanning opens /pay/[token] on the mobile device
 * 3. The person with the mobile taps "Confirm Payment" on that page
 * 4. This component detects the confirmation via Supabase Realtime and shows a green banner
 * 5. Finance Manager fills in the payment form and clicks Record Payment
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, QrCode, Loader2, RefreshCw } from 'lucide-react'
import { PaymentForm } from './payment-form'
import type { PaymentFormValues } from '@/lib/validations/invoice'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface Props {
  invoiceId: string
  invoiceNumber: string
  remainingAmount: number
  currency: string
  qrUrl: string
  onSubmit: (values: PaymentFormValues) => Promise<void>
}

export function PaymentFormWithQR({
  invoiceId,
  invoiceNumber,
  remainingAmount,
  currency,
  qrUrl,
  onSubmit,
}: Props) {
  const [qrConfirmed, setQrConfirmed] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(true)

  // ── Generate QR image — use a smaller, scannable size ───────────────────
  useEffect(() => {
    // Use the full qrUrl directly — it's already short (just base64 invoice ID)
    const encoded = encodeURIComponent(qrUrl)
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&bgcolor=1a2035&color=e2e8f0&margin=8&ecc=M`
    setQrImageUrl(url)
    setLoadingQr(false)
  }, [qrUrl])

  // ── Realtime — listen for QR confirmation notification ───────────────────
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      channel = supabase
        .channel(`qr-payment-${invoiceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'approval_notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const n = payload.new as {
              type: string
              entity_id: string | null
              title: string
            }
            // Check if this is a QR payment confirmation for THIS invoice
            if (
              n.type === 'payment_recorded' &&
              n.entity_id === invoiceId &&
              n.title?.startsWith('QR Payment Confirmed')
            ) {
              setQrConfirmed(true)
            }
          },
        )
        .subscribe()
    })

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [invoiceId])

  return (
    <div className="grid gap-6 lg:grid-cols-2 max-w-3xl">

      {/* ── Left: QR Code panel ── */}
      <div className="space-y-4">
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-[--color-primary]" />
            <h3 className="text-sm font-semibold text-[--color-foreground]">
              Scan to Confirm Payment
            </h3>
          </div>

          <p className="text-xs text-[--color-foreground-muted] leading-relaxed">
            Scan this QR code with your mobile device to confirm the payment authorisation.
            Once confirmed, you can record the payment below.
          </p>

          {/* QR Code */}
          <div className="flex justify-center">
            <div
              className="rounded-xl p-3 flex items-center justify-center"
              style={{ background: '#1a2035', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {loadingQr ? (
                <div className="h-[220px] w-[220px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white/40 animate-spin" />
                </div>
              ) : qrImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrImageUrl}
                  alt="Payment QR Code"
                  width={220}
                  height={220}
                  className="rounded-lg"
                />
              ) : (
                <div className="h-[220px] w-[220px] flex flex-col items-center justify-center gap-2">
                  <QrCode className="h-12 w-12 text-white/20" />
                  <p className="text-xs text-white/30">QR unavailable</p>
                  <p className="text-[10px] text-white/20 break-all px-2 text-center">{qrUrl}</p>
                </div>
              )}
            </div>
          </div>

          {/* Amount info */}
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(139,159,232,0.08)', border: '1px solid rgba(139,159,232,0.18)' }}
          >
            <p className="text-[10px] text-[--color-foreground-subtle] uppercase tracking-widest mb-0.5">Amount</p>
            <p className="text-xl font-bold text-[--color-foreground]">{formatCurrency(remainingAmount)}</p>
            <p className="text-[11px] text-[--color-foreground-muted] mt-0.5">{invoiceNumber}</p>
          </div>

          {/* QR confirmation status */}
          {!qrConfirmed ? (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <p className="text-xs text-amber-400">Waiting for QR scan confirmation…</p>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-xs font-semibold text-emerald-400">
                Payment confirmed via QR! You can now record it →
              </p>
            </div>
          )}

          {/* Fallback link */}
          <details className="group">
            <summary className="cursor-pointer text-[11px] text-[--color-foreground-subtle] hover:text-[--color-foreground-muted] select-none">
              Can&apos;t scan? Click to show link
            </summary>
            <div className="mt-2 rounded-lg p-2" style={{ background: 'var(--color-background-subtle)' }}>
              <p className="text-[10px] text-[--color-foreground-subtle] break-all">{qrUrl}</p>
            </div>
          </details>
        </div>
      </div>

      {/* ── Right: Payment form ── */}
      <div>
        {!qrConfirmed && (
          <div
            className="mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            <QrCode className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300">
              Scan the QR code first to confirm payment authorisation, then fill in the details below.
            </p>
          </div>
        )}
        <PaymentForm
          invoiceId={invoiceId}
          invoiceNumber={invoiceNumber}
          remainingAmount={remainingAmount}
          currency={currency}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
