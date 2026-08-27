import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/auth/company-signup
 *
 * Email-first company registration:
 * 1. Creates auth user (email+password only, no company profile yet)
 * 2. Generates confirmation link via Supabase admin
 * 3. Sends confirmation email via Brevo
 *
 * After clicking the link → /auth/callback → /workspace/setup
 */

async function sendConfirmationEmail(
  toEmail: string,
  toName: string,
  confirmationUrl: string,
): Promise<boolean> {
  const brevoKey = process.env.BREVO_API_KEY
  if (!brevoKey || brevoKey === 'your_brevo_api_key_here') return false

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'VendorFlow'
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'noreply@vendorflow.app'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const year = new Date().getFullYear()

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Confirm your email — ${appName}</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4F8CFF,#8B5CF6);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${appName}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Company Portal</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 12px;color:#0d1117;font-size:16px;font-weight:600;">Hi ${toName},</p>
            <p style="margin:0 0 8px;color:#4b5563;font-size:14px;line-height:1.7;">
              Welcome to <strong>${appName}</strong>! You're one step away from setting up your company workspace.
            </p>
            <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7;">
              Please confirm your email address to continue. After confirmation, you'll be guided to set up your company profile and workspace.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${confirmationUrl}" style="background:linear-gradient(135deg,#4F8CFF,#8B5CF6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Confirm Email &amp; Continue
              </a>
            </div>
            <p style="margin:20px 0 0;color:#6b7280;font-size:13px;">
              Or copy this link:<br/>
              <a href="${confirmationUrl}" style="color:#4F8CFF;word-break:break-all;">${confirmationUrl}</a>
            </p>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
              This link expires in 24 hours. If you didn't sign up, ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © ${year} ${appName} · <a href="${appUrl}" style="color:#4F8CFF;text-decoration:none;">Visit Platform</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
      body: JSON.stringify({
        sender: { name: appName, email: senderEmail },
        to: [{ email: toEmail, name: toName }],
        subject: `Confirm your email — ${appName}`,
        htmlContent,
        textContent: `Hi ${toName},\n\nPlease confirm your email to set up your company workspace:\n${confirmationUrl}\n\nThis link expires in 24 hours.`,
      }),
    })
    if (!res.ok) {
      console.error('[company-signup] Brevo error:', res.status, await res.text())
      return false
    }
    console.log('[company-signup] Confirmation email sent to:', toEmail)
    return true
  } catch (err) {
    console.error('[company-signup] Email send failed:', err)
    return false
  }
}

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Create auth user via admin API — email NOT confirmed yet, no company profile yet
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName },
    })

    if (authError) {
      if (authError.message?.includes('already registered') || authError.message?.includes('already been registered')) {
        return NextResponse.json({ error: 'This email is already registered. Please sign in.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user?.id
    if (!userId) return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })

    // Auto-confirm email server-side, then send a magic sign-in link.
    // This avoids one-time confirmation token expiry issues.
    await admin.auth.admin.updateUserById(userId, { email_confirm: true })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${appUrl}/auth/magic-callback` },
    })

    if (linkError) {
      console.error('[company-signup] generateLink error:', linkError.message)
      return NextResponse.json({ ok: true, userId, emailSent: false })
    }

    const signInUrl = linkData?.properties?.action_link
    if (!signInUrl) {
      return NextResponse.json({ ok: true, userId, emailSent: false })
    }

    const emailSent = await sendConfirmationEmail(email, fullName, signInUrl)

    return NextResponse.json({
      ok: true,
      userId,
      emailSent,
      confirmationUrl: !emailSent ? signInUrl : null,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Registration failed'
    console.error('[company-signup]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
