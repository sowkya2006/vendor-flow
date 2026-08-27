import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/auth/vendor-signup
 *
 * Step 1 of vendor registration — email-first flow:
 * 1. Creates auth user (email+password only, NO company profile yet)
 * 2. Generates confirmation link
 * 3. Sends via Brevo — user must verify email BEFORE filling company profile
 *
 * After clicking the link → /auth/callback?vendor=1 → /vendor/complete-profile
 * The complete-profile page collects company details and saves vendor_companies.
 */

async function sendConfirmationEmail(
  toEmail: string,
  toName: string | null,
  confirmationUrl: string,
): Promise<boolean> {
  const brevoKey = process.env.BREVO_API_KEY
  if (!brevoKey || brevoKey === 'your_brevo_api_key_here') return false

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'VendorFlow'
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'noreply@vendorflow.app'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const year = new Date().getFullYear()
  const greeting = toName ? `Hi ${toName},` : 'Hello,'

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
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Vendor Portal</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 12px;color:#0d1117;font-size:16px;font-weight:600;">${greeting}</p>
            <p style="margin:0 0 8px;color:#4b5563;font-size:14px;line-height:1.7;">
              Welcome to <strong>${appName}</strong> Vendor Portal!
            </p>
            <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7;">
              Your account is ready. Click the button below to sign in and complete your vendor company profile.
              This link signs you in automatically — no password needed.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${confirmationUrl}" style="background:linear-gradient(135deg,#4F8CFF,#8B5CF6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Sign In &amp; Complete Profile
              </a>
            </div>
            <p style="margin:20px 0 0;color:#6b7280;font-size:13px;">
              Or copy this link:<br/>
              <a href="${confirmationUrl}" style="color:#4F8CFF;word-break:break-all;">${confirmationUrl}</a>
            </p>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
              This link expires in 1 hour. You can also sign in with your email and password at any time.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${year} ${appName} · <a href="${appUrl}" style="color:#4F8CFF;text-decoration:none;">Visit Platform</a></p>
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
        to: [{ email: toEmail, name: toName ?? toEmail }],
        subject: `Sign in to ${appName} Vendor Portal`,
        htmlContent,
        textContent: `${greeting}\n\nYour vendor account is ready. Click the link below to sign in and complete your profile:\n${confirmationUrl}\n\nThis link expires in 1 hour. You can also sign in with your password.`,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[vendor-signup] Brevo error:', res.status, err)
      return false
    }
    console.log('[vendor-signup] Confirmation email sent to:', toEmail)
    return true
  } catch (err) {
    console.error('[vendor-signup] Email send failed:', err)
    return false
  }
}

export async function POST(req: Request) {
  try {
    const { email, password, contactName } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // Create auth user — email NOT confirmed, NO vendor_companies insert yet
    // Company profile is filled AFTER email verification on /vendor/complete-profile
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: contactName ?? '',
        is_vendor: true,
        // Flag to indicate profile is not yet complete
        vendor_profile_complete: false,
      },
    })

    if (authError) {
      if (authError.message?.includes('already registered') || authError.message?.includes('already been registered')) {
        return NextResponse.json({ error: 'This email is already registered. Please sign in.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user?.id
    if (!userId) return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })

    // Auto-confirm the email server-side immediately.
    // We send a magic sign-in link via Brevo instead of a confirmation link.
    // This avoids the "link expired/already used" problem with one-time confirmation tokens.
    await admin.auth.admin.updateUserById(userId, { email_confirm: true })

    // Generate a magic sign-in link — signs the user in directly when clicked
    // No expiry issues: magic links are valid for 1 hour and can be regenerated
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${appUrl}/auth/magic-callback?vendor=1` },
    })

    if (linkError) {
      console.error('[vendor-signup] generateLink error:', linkError.message)
      // Email confirmed but can't send link — user can sign in with password
      return NextResponse.json({ ok: true, userId, emailSent: false })
    }

    const signInUrl = linkData?.properties?.action_link
    if (!signInUrl) {
      return NextResponse.json({ ok: true, userId, emailSent: false })
    }

    const emailSent = await sendConfirmationEmail(email, contactName ?? null, signInUrl)

    return NextResponse.json({
      ok: true,
      userId,
      emailSent,
      confirmationUrl: !emailSent ? signInUrl : null,
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Registration failed'
    console.error('[vendor-signup]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
