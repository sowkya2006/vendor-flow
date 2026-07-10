'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  createInvitation,
  updateEmployee,
  updateRolePermissions,
} from '@/lib/supabase/roles'
import type { PermissionKey } from '@/lib/supabase/roles'
import { createClient } from '@/lib/supabase/server'

// ── Invite employee ────────────────────────────────────────────
const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  full_name: z.string().max(200).optional().nullable(),
  role_slug: z.string().min(1, 'Role is required'),
  department: z.string().max(100).optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
})

export async function inviteEmployeeAction(input: unknown) {
  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid: ' + JSON.stringify(parsed.error.flatten()))
  const user = await getUser()
  const companyId = await getCompanyId()
  await createInvitation(companyId, user.id, {
    email: parsed.data.email,
    full_name: parsed.data.full_name ?? undefined,
    role_slug: parsed.data.role_slug,
    department: parsed.data.department ?? undefined,
    designation: parsed.data.designation ?? undefined,
  })
  revalidatePath('/settings/employees')
}

// ── Update employee ────────────────────────────────────────────
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
  const parsed = updateEmployeeSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid: ' + JSON.stringify(parsed.error.flatten()))
  const companyId = await getCompanyId()
  const { id, ...updates } = parsed.data
  await updateEmployee(id, companyId, updates)
  revalidatePath('/settings/employees')
}

// ── Update role permissions ────────────────────────────────────
const rolePermSchema = z.object({
  role_id: z.string().uuid(),
  permissions: z.array(z.string()),
})

export async function updateRolePermissionsAction(input: unknown) {
  const parsed = rolePermSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid: ' + JSON.stringify(parsed.error.flatten()))
  await getCompanyId() // ensure authenticated
  await updateRolePermissions(parsed.data.role_id, parsed.data.permissions as PermissionKey[])
  revalidatePath('/settings/roles')
}

// ── Create custom role ─────────────────────────────────────────
const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
})

export async function createRoleAction(input: unknown) {
  const parsed = createRoleSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid: ' + JSON.stringify(parsed.error.flatten()))
  const companyId = await getCompanyId()
  const supabase = await createClient()
  const slug = parsed.data.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('roles').insert({
    company_id: companyId,
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? null,
    is_system: false,
  })
  if (error) throw new Error('Failed to create role: ' + error.message)
  revalidatePath('/settings/roles')
}
