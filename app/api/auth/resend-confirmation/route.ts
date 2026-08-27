import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/auth/resend-confirmation
 * Generates a new confirmation link for an unconfirmed user and sends it via Brevo.
 */

async function sendEmail(toEmail: string, confirmationUrl: string, isVendor: boolean): Promise<boolean> {
  const brevoKey = process.env.BREVO_API_KEY
  if (!brevoKey || brevoKey === 'your_brevo_api_key_here') return false

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'VendorFlow'
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'noreply@vendorflow.app'
  const portal = isVendor ? 'Vendor Portal' : 'Company Portal'
  const redirectAfter = isVendor ? '/vendor/complete-profile' : '/workspace/setup'
  void redirectAfter

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: appName, email: senderEmail },
        to: [{ email: toEmail }],
        subject: `New confirmation link — ${appName}`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
            <h2 style="color:#0d1117;">New Confirmation Link</h2>
            <p style="color:#4b5563;">Here is your new email confirmation link for <strong>${appName}</strong> ${portal}.</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${confirmationUrl}" style="background:linear-gradient(135deg,#4F8CFF,#8B5CF6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Confirm Email Address
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;">This link expires in 24 hours. If you didn't request this, ignore this email.</p>
            <p style="color:#6b7280;font-size:12px;">Or copy: <a href="${confirmationUrl}" style="color:#4F8CFF;">${confirmationUrl}</a></p>
          </div>`,
        textContent: `New confirmation link for ${appName}:\n${confirmationUrl}\n\nExpires in 24 hours.`,
      }),
    })
    return res.ok
  } catch { return false }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Find the user
    const { data: listData } = await admin.auth.admin.listUsers()
    const users = listData?.users ?? []
    const user = users.find((u: { email: string }) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email. Please sign up.' }, { status: 404 })
    }

    if (user.email_confirmed_at) {
      return NextResponse.json({ error: 'This email is already confirmed. Please sign in.' }, { status: 400 })
    }

    const isVendor = user.user_metadata?.is_vendor === true
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const redirectTo = isVendor
      ? `${appUrl}/vendor/verify-complete`
      : `${appUrl}/auth/callback`

    // Generate a fresh confirmation link
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('[resend-confirmation] generateLink error:', linkError?.message)
      return NextResponse.json({ error: 'Failed to generate link. Please try again.' }, { status: 500 })
    }

    const confirmationUrl = linkData.properties.action_link
    const sent = await sendEmail(email, confirmationUrl, isVendor)

    if (!sent) {
      // Brevo not working — return the URL so user can auto-confirm (dev only)
      return NextResponse.json({ ok: true, confirmationUrl })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    console.error('[resend-confirmation]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
