'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import { guardRole } from '@/lib/supabase/permission-guard'
import {
  createInvitation,
  updateEmployee,
  updateRolePermissions,
} from '@/lib/supabase/roles'
import type { PermissionKey } from '@/lib/supabase/roles'
import { createClient } from '@/lib/supabase/server'

const ADMIN_ROLES = ['administrator', 'admin']

// ── Invite employee — ADMIN ONLY ───────────────────────────────
const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  full_name: z.string().max(200).optional().nullable(),
  role_slug: z.string().min(1, 'Role is required'),
  department: z.string().max(100).optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
})

export async function inviteEmployeeAction(input: unknown) {
  await guardRole(ADMIN_ROLES) // throws FORBIDDEN if not admin
  const parsed = inviteSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(
      'Invalid: ' + JSON.stringify(parsed.error.flatten())
    )
  }

  const user = await getUser()
  const companyId = await getCompanyId()

  // Store invitation in database
  const invitation = await createInvitation(companyId, user.id, {
    email: parsed.data.email,
    full_name: parsed.data.full_name ?? undefined,
    role_slug: parsed.data.role_slug,
    department: parsed.data.department ?? undefined,
    designation: parsed.data.designation ?? undefined,
  })

  // Resolve the app URL dynamically — works in both dev and production.
  const appUrl = (() => {
    if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
      return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  })()

  try {
    // Build a direct invite link — no Supabase auth magic link needed.
    // The /invite/[token] page handles password creation via the admin API,
    // so there's no rate limit issue from Supabase auth.generateLink.
    const inviteLink = `${appUrl}/invite/${invitation.token}`

    console.log('===================================')
    console.log('Sending invitation...')
    console.log('Email:', parsed.data.email)
    console.log('Company:', companyId)
    console.log('Token:', invitation.token)
    console.log('Invite Link:', inviteLink)
    console.log('App URL:', appUrl)
    console.log('===================================')

    // Send email via Brevo — wrapped in separate try/catch, never throws
    sendInviteEmail({
      email: parsed.data.email,
      fullName: parsed.data.full_name ?? null,
      inviteLink,
      roleName: parsed.data.role_slug.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    }).catch(e => console.error('[invite] Background email error:', e instanceof Error ? e.message : e))

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[invite] Critical error:', msg)
    throw new Error(msg)
  }

  revalidatePath('/settings/employees')
}

// ── Send invite email via Brevo (fire and forget) ──────────────
async function sendInviteEmail({
  email, fullName, inviteLink, roleName,
}: {
  email: string
  fullName: string | null
  inviteLink: string
  roleName: string
}) {
  const brevoKey = process.env.BREVO_API_KEY
  if (!brevoKey || brevoKey === 'your_brevo_api_key_here') {
    console.warn('[invite] BREVO_API_KEY not configured — skipping email. Invite link:', inviteLink)
    return
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? 'noreply@vendorflow.app'
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'VendorFlow'
  const year = new Date().getFullYear()

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>You've been invited — ${appName}</title></head>
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
            <p style="margin:0 0 12px;color:#0d1117;font-size:16px;font-weight:600;">You've been invited!</p>
            <p style="margin:0 0 20px;color:#4b5563;font-size:14px;line-height:1.7;">
              You have been invited to join <strong>${appName}</strong> as a <strong>${roleName}</strong>.
              Click the button below to set your password and access the platform.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${inviteLink}" style="background:linear-gradient(135deg,#4F8CFF,#8B5CF6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                Accept Invitation &amp; Set Password
              </a>
            </div>
            <p style="margin:20px 0 0;color:#6b7280;font-size:13px;">
              Or copy: <a href="${inviteLink}" style="color:#4F8CFF;word-break:break-all;">${inviteLink}</a>
            </p>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">Expires in 24 hours.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${year} ${appName}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': brevoKey },
    body: JSON.stringify({
      sender: { name: appName, email: senderEmail },
      to: [{ email, name: fullName ?? email }],
      subject: `You've been invited to ${appName}`,
      htmlContent,
      textContent: `You've been invited to join ${appName} as ${roleName}.\n\nClick: ${inviteLink}\n\nExpires in 24 hours.`,
    }),
  })

  if (!emailRes.ok) {
    console.error('[invite] Brevo error:', emailRes.status)
  } else {
    console.log('[invite] Invitation email sent to:', email)
  }

  revalidatePath('/settings/employees')
}

// ── Update employee — ADMIN ONLY ──────────────────────────────
const updateEmployeeSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().max(200).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
})

export async function updateEmployeeAction(input: unknown) {
  await guardRole(ADMIN_ROLES) // throws FORBIDDEN if not admin
  const parsed = updateEmployeeSchema.safeParse(input)
  if (!parsed.success)
    throw new Error('Invalid: ' + JSON.stringify(parsed.error.flatten()))

  const companyId = await getCompanyId()
  const { id, ...updates } = parsed.data

  await updateEmployee(id, companyId, updates)

  revalidatePath('/settings/employees')
}

// ── Update role permissions — ADMIN ONLY ──────────────────────
const rolePermSchema = z.object({
  role_id: z.string().uuid(),
  permissions: z.array(z.string()),
})

export async function updateRolePermissionsAction(input: unknown) {
  await guardRole(ADMIN_ROLES) // throws FORBIDDEN if not admin
  const parsed = rolePermSchema.safeParse(input)

  if (!parsed.success)
    throw new Error('Invalid: ' + JSON.stringify(parsed.error.flatten()))

  await getCompanyId()

  await updateRolePermissions(
    parsed.data.role_id,
    parsed.data.permissions as PermissionKey[]
  )

  revalidatePath('/settings/roles')
}

// ── Create custom role — ADMIN ONLY ───────────────────────────
const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
})

export async function createRoleAction(input: unknown) {
  await guardRole(ADMIN_ROLES) // throws FORBIDDEN if not admin
  const parsed = createRoleSchema.safeParse(input)

  if (!parsed.success)
    throw new Error('Invalid: ' + JSON.stringify(parsed.error.flatten()))

  const companyId = await getCompanyId()
  const supabase = await createClient()

  const slug = parsed.data.name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('roles')
    .insert({
      company_id: companyId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      is_system: false,
    })

  if (error) {
    throw new Error('Failed to create role: ' + error.message)
  }

  revalidatePath('/settings/roles')
}