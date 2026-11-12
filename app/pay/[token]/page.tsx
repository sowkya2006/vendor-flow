'use client'

/**
 * /pay/[token] — Mobile QR payment confirmation page
 *
 * This page is opened when someone scans the QR code on the
 * Record Payment screen. It shows the invoice details and a
 * "Confirm Payment" button. No login required.
 */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle, CreditCard, Building2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TokenData {
  invoiceNumber: string
  vendorName: string
  amount: number
  currency: string
  invoiceId: string
}

type Status = 'loading' | 'ready' | 'confirming' | 'success' | 'error' | 'invalid'

function decodeToken(token: string): TokenData | null {
  try {
    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'))
    const [payload] = decoded.split('.')
    const data = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return data as TokenData
  } catch {
    return null
  }
}

export default function PayConfirmPage() {
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<Status>('loading')
  const [data, setData] = useState<TokenData | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const decoded = decodeToken(token)
    if (!decoded) {
      setStatus('invalid')
      return
    }
    setData(decoded)
    setStatus('ready')
  }, [token])

  async function handleConfirm() {
    setStatus('confirming')
    try {
      const res = await fetch('/api/payment-qr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error ?? 'Confirmation failed')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  const formatAmount = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 space-y-6"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-xl bg-blue-500 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">VendorFlow</span>
          </div>
          <p className="text-xs text-white/40">Secure Payment Confirmation</p>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            <p className="text-sm text-white/60">Loading payment details…</p>
          </div>
        )}

        {/* Invalid */}
        {status === 'invalid' && (
          <div className="flex flex-col items-center py-8 gap-3 text-center">
            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Invalid QR Code</p>
              <p className="text-xs text-white/50 mt-1">This QR code is invalid or has expired. Please ask the finance team to generate a new one.</p>
            </div>
          </div>
        )}

        {/* Ready — show payment details */}
        {(status === 'ready' || status === 'confirming') && data && (
          <>
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Payment Details</p>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40">Invoice</p>
                    <p className="text-sm font-semibold text-white">{data.invoiceNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40">Vendor</p>
                    <p className="text-sm font-semibold text-white">{data.vendorName}</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div
                className="rounded-xl p-4 text-center mt-2"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest mb-1">Amount Due</p>
                <p className="text-3xl font-bold text-emerald-400 tracking-tight">
                  {formatAmount(data.amount, data.currency)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleConfirm}
                disabled={status === 'confirming'}
                className="w-full h-14 text-base font-bold rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  boxShadow: '0 4px 24px rgba(34,197,94,0.4)',
                  color: 'white',
                  border: 'none',
                }}
              >
                {status === 'confirming' ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" />Confirming…</>
                ) : (
                  <>✓ Confirm Payment</>
                )}
              </Button>
              <p className="text-center text-[11px] text-white/30">
                By confirming, you verify this payment has been authorised
              </p>
            </div>
          </>
        )}

        {/* Success */}
        {status === 'success' && data && (
          <div className="flex flex-col items-center py-6 gap-5 text-center">
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '2px solid rgba(34,197,94,0.4)',
                boxShadow: '0 0 40px rgba(34,197,94,0.3)',
              }}
            >
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Payment Confirmed!</p>
              <p className="text-sm text-white/50 mt-2">
                {formatAmount(data.amount, data.currency)} for {data.invoiceNumber}
              </p>
            </div>
            <div
              className="w-full rounded-2xl p-4 text-center"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <p className="text-xs text-emerald-400 leading-relaxed">
                ✓ The finance team has been notified.<br />
                They will record this payment in the system.
              </p>
            </div>
            <p className="text-[11px] text-white/25">You may close this page</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex flex-col items-center py-6 gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Confirmation Failed</p>
              <p className="text-xs text-white/50 mt-1">{error}</p>
            </div>
            <Button
              onClick={() => setStatus('ready')}
              variant="outline"
              className="rounded-xl"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
