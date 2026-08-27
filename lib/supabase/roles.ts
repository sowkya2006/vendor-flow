/**
 * roles.ts — Data layer for roles, permissions, employees, and invitations.
 * All server-side. RLS enforces company isolation.
 */
import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as { from: (t: string) => any; rpc: (fn: string, args?: any) => any }
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PortalRole {
  id: string
  company_id: string
  name: string
  slug: string
  description: string | null
  is_system: boolean
  created_at: string
  permissions?: PermissionKey[]
}

export interface Permission {
  id: string
  key: string
  label: string
  group_name: string
  description: string | null
}

export type PermissionKey =
  | 'manage_vendors' | 'manage_products' | 'manage_rfqs' | 'manage_quotations'
  | 'manage_purchase_orders' | 'manage_inventory' | 'manage_invoices' | 'manage_payments'
  | 'finance_access' | 'approve_rfqs' | 'approve_quotations' | 'approve_purchase_orders'
  | 'view_reports' | 'export_data' | 'manage_employees' | 'manage_roles' | 'manage_settings'

export interface Employee {
  id: string
  company_id: string
  full_name: string | null
  email: string | null
  phone: string | null
  department: string | null
  designation: string | null
  role: string
  status: string
  avatar_url: string | null
  created_at: string
  roles?: PortalRole[]
}

export interface Invitation {
  id: string
  company_id: string
  email: string
  full_name: string | null
  role_slug: string
  department: string | null
  designation: string | null
  token: string
  accepted_at: string | null
  expires_at: string
  created_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENT USER ROLE / PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getCurrentUserRole = cache(async (): Promise<{
  role: string
  permissions: PermissionKey[]
} | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const client = await db()
  const { data: userRow } = await client
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!userRow) return null
  const { role, company_id } = userRow as { role: string; company_id: string }

  // Get permissions via user_roles → role_permissions
  const { data: userRolesData } = await client
    .from('user_roles')
    .select('role:roles(slug, role_permissions(permission:permissions(key)))')
    .eq('user_id', user.id)
    .eq('company_id', company_id)

  // Collect permission keys from assigned roles
  const permKeys = new Set<PermissionKey>()

  // Administrator always gets all permissions without needing DB records
  if (role === 'administrator' || role === 'admin') {
    const { data: allPerms } = await client.from('permissions').select('key')
    for (const p of allPerms ?? []) permKeys.add(p.key as PermissionKey)
  } else {
    for (const ur of userRolesData ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleData = (ur as any).role
      if (!roleData) continue
      for (const rp of roleData.role_permissions ?? []) {
        const perm = rp.permission
        if (perm?.key) permKeys.add(perm.key as PermissionKey)
      }
    }
  }

  return { role, permissions: Array.from(permKeys) }
})

export function hasPermission(permissions: PermissionKey[], key: PermissionKey): boolean {
  return permissions.includes(key)
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLES CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function getRoles(companyId: string): Promise<PortalRole[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('roles')
    .select('*, role_permissions(permission:permissions(key))')
    .eq('company_id', companyId)
    .order('is_system', { ascending: false })
    .order('name')
  if (error) throw error

  return (data ?? []).map((r: {
    id: string; company_id: string; name: string; slug: string
    description: string | null; is_system: boolean; created_at: string
    role_permissions: Array<{ permission: { key: string } | null }>
  }) => ({
    id: r.id,
    company_id: r.company_id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    is_system: r.is_system,
    created_at: r.created_at,
    permissions: (r.role_permissions ?? []).map((rp) => rp.permission?.key as PermissionKey).filter(Boolean),
  }))
}

export async function getAllPermissions(): Promise<Permission[]> {
  const supabase = await db()
  const { data, error } = await supabase.from('permissions').select('*').order('group_name').order('label')
  if (error) throw error
  return (data ?? []) as Permission[]
}

export async function updateRolePermissions(roleId: string, permissionKeys: PermissionKey[]): Promise<void> {
  const supabase = await db()

  // Delete existing
  await supabase.from('role_permissions').delete().eq('role_id', roleId)

  if (permissionKeys.length === 0) return

  // Fetch permission IDs
  const { data: perms } = await supabase
    .from('permissions')
    .select('id, key')
    .in('key', permissionKeys)

  if (!perms || perms.length === 0) return

  const rows = (perms as { id: string; key: string }[]).map((p) => ({
    role_id: roleId,
    permission_id: p.id,
  }))

  const { error } = await supabase.from('role_permissions').insert(rows)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployees(companyId: string): Promise<Employee[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('users')
    .select('id, company_id, full_name, email, phone, department, designation, role, status, avatar_url, created_at, user_roles(role:roles(id, name, slug))')
    .eq('company_id', companyId)
    .order('full_name')
  if (error) throw error
  return (data ?? []) as Employee[]
}

export async function getEmployeeById(id: string, companyId: string): Promise<Employee | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('users')
    .select('id, company_id, full_name, email, phone, department, designation, role, status, avatar_url, created_at, user_roles(role:roles(id, name, slug))')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()
  if (error) return null
  return data as Employee
}

export async function updateEmployee(
  id: string,
  companyId: string,
  updates: Partial<Pick<Employee, 'full_name' | 'phone' | 'department' | 'designation' | 'role' | 'status'>>,
): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// INVITATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function getInvitations(companyId: string): Promise<Invitation[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('employee_invitations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Invitation[]
}

export async function createInvitation(
  companyId: string,
  invitedBy: string,
  input: { email: string; full_name?: string; role_slug: string; department?: string; designation?: string },
): Promise<Invitation> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('employee_invitations')
    .upsert({
      company_id: companyId,
      email: input.email,
      full_name: input.full_name ?? null,
      role_slug: input.role_slug,
      department: input.department ?? null,
      designation: input.designation ?? null,
      invited_by: invitedBy,
      accepted_at: null,
      expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    }, { onConflict: 'company_id,email' })
    .select()
    .single()
  if (error) throw error
  return data as Invitation
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  // Use admin client to bypass RLS — the employee is unauthenticated when
  // they click the invite link, so the regular scoped client returns null
  // even for valid, unexpired invitations.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  const { data, error } = await admin
    .from('employee_invitations')
    .select('*')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .is('accepted_at', null)
    .maybeSingle()

  if (error) {
    console.error('[getInvitationByToken] error:', error.message)
    return null
  }

  if (!data) {
    // Log why it's null for debugging
    // Check if token exists at all (ignoring expiry/accepted)
    const { data: anyInv } = await admin
      .from('employee_invitations')
      .select('token, expires_at, accepted_at')
      .eq('token', token)
      .maybeSingle()

    if (!anyInv) {
      console.warn('[getInvitationByToken] Token not found in DB:', token.substring(0, 8) + '...')
    } else if (anyInv.accepted_at) {
      console.warn('[getInvitationByToken] Token already accepted:', token.substring(0, 8) + '...')
    } else {
      console.warn('[getInvitationByToken] Token expired. expires_at:', anyInv.expires_at)
    }
    return null
  }

  return data as Invitation
}

export async function acceptInvitation(token: string, userId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('employee_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)
  if (error) throw error

  // Update user status
  await supabase
    .from('users')
    .update({ status: 'active' })
    .eq('id', userId)
}
