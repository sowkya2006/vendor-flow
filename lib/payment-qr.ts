/**
 * payment-qr.ts — Generate and verify payment QR tokens
 * Server-side only. Uses HMAC-SHA256 to sign the token.
 */
import { createHmac } from 'crypto'

export interface PaymentTokenData {
  invoiceId: string
  invoiceNumber: string
  vendorName: string
  amount: number
  currency: string
  companyId: string
  expiresAt: number  // Unix timestamp (ms)
}

function b64url(s: string): string {
  return Buffer.from(s).toString('base64url')
}

export function generatePaymentToken(data: Omit<PaymentTokenData, 'expiresAt'>): string {
  const payload: PaymentTokenData = {
    ...data,
    expiresAt: Date.now() + 30 * 60 * 1000,  // 30 minutes
  }
  const payloadB64 = b64url(JSON.stringify(payload))
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
  const sig = createHmac('sha256', secret).update(payloadB64).digest('hex')
  return b64url(`${payloadB64}.${sig}`)
}

export function verifyPaymentToken(token: string): PaymentTokenData | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const [payloadB64, sig] = decoded.split('.')
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret'
    const expected = createHmac('sha256', secret).update(payloadB64).digest('hex')
    if (sig !== expected) return null
    const data: PaymentTokenData = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    if (Date.now() > data.expiresAt) return null
    return data
  } catch {
    return null
  }
}
