/**
 * permission-guard.ts
 * Server-side permission checking for server actions and API routes.
 * Reads the role directly from the database — never trusts client state.
 */
import { getUserRole } from '@/lib/supabase/get-auth'
import { requirePermission } from '@/config/nav-roles'

/**
 * guardPermission — throws FORBIDDEN if the current user lacks the permission.
 * Call at the start of any sensitive server action.
 *
 * @example
 * await guardPermission('approve_purchase_orders')
 */
export async function guardPermission(permission: string): Promise<string> {
  const role = await getUserRole()
  requirePermission(role, permission)  // throws if not allowed
  return role
}

/**
 * guardRole — throws FORBIDDEN if the user is not one of the allowed roles.
 */
export async function guardRole(allowedRoles: string[]): Promise<string> {
  const role = await getUserRole()
  const normalised = role === 'admin' ? 'administrator' : role
  if (!allowedRoles.includes(normalised) && !allowedRoles.includes(role)) {
    throw new Error(`FORBIDDEN: role '${role}' is not allowed to perform this action`)
  }
  return role
}
