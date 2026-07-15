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
import { createAdminClient } from '@/lib/supabase/admin'

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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    console.log('===================================')
    console.log('Sending invitation...')
    console.log('Email:', parsed.data.email)
    console.log('Company:', companyId)
    console.log('Token:', invitation.token)
    console.log('App URL:', appUrl)
    console.log('===================================')

    const adminClient = createAdminClient()

    const { data, error } =
      await adminClient.auth.admin.inviteUserByEmail(
        parsed.data.email,
        {
          data: {
            full_name: parsed.data.full_name ?? '',
            invite_token: invitation.token,
            company_id: companyId,
            role_slug: parsed.data.role_slug,
          },
          // Use /auth/confirm — Supabase admin invite uses implicit flow (hash fragment)
          // /auth/callback is server-side and cannot read hash fragments
          redirectTo: `${appUrl}/auth/confirm`,
        }
      )

    console.log('===================================')
    console.log('SUPABASE RESPONSE')
    console.log('DATA:', data)
    console.log('ERROR:', error)
    console.log('===================================')

    if (error) {
      throw error
    }

    console.log('Invitation sent successfully.')
  } catch (error) {
    console.log('===================================')
    console.error('SUPABASE INVITE ERROR')
    console.error(error)
    console.log('===================================')

    throw error
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