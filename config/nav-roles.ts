/**
 * nav-roles.ts — Role-filtered navigation configurations.
 * Returns the correct NavGroup[] for each role slug.
 */
import type { NavGroup } from '@/config/nav'
import { mainNav } from '@/config/nav'

export type RoleSlug =
  | 'administrator'
  | 'admin'
  | 'procurement_manager'
  | 'procurement_officer'
  | 'warehouse_manager'
  | 'finance_manager'
  | 'member'
  | 'viewer'

/** Items visible to each role (allow-list approach). */
const ROLE_ALLOWED_HREFS: Record<RoleSlug, string[] | '*'> = {
  administrator: '*',
  admin: '*',

  procurement_manager: [
    '/dashboard',
    '/procurement',
    '/vendors', '/vendors/marketplace', '/products', '/rfqs', '/quotations', '/purchase-orders',
    '/inventory', '/order-tracking',
    '/communication', '/notifications',
    '/approvals', '/approvals/pending', '/approval-workflows', '/audit-log',
    '/analytics', '/analytics/procurement', '/analytics/vendors',
    '/analytics/inventory', '/analytics/approvals',
    '/reports',
    '/settings',
  ],

  procurement_officer: [
    '/dashboard',
    '/procurement',
    '/vendors', '/vendors/marketplace', '/rfqs', '/quotations', '/purchase-orders', '/products',
    '/order-tracking',
    '/communication', '/notifications',
    '/analytics', '/analytics/procurement',
    '/settings',
  ],

  warehouse_manager: [
    '/dashboard',
    '/procurement',
    '/inventory', '/inventory/warehouses', '/inventory/grn', '/order-tracking',
    '/products',
    '/notifications',
    '/analytics', '/analytics/inventory',
    '/settings',
  ],

  finance_manager: [
    '/dashboard',
    '/payments', '/payments/invoices', '/payments/outstanding',
    '/payments/overdue', '/payments/history', '/payments/vendors',
    '/communication', '/notifications',
    '/analytics', '/analytics/finance',
    '/reports',
    '/settings',
  ],

  member: [
    '/dashboard',
    '/procurement',
    '/vendors', '/rfqs', '/quotations', '/purchase-orders', '/products',
    '/notifications',
    '/settings',
  ],

  viewer: [
    '/dashboard',
    '/analytics',
    '/analytics/procurement', '/analytics/vendors',
    '/analytics/inventory', '/analytics/finance', '/analytics/approvals',
    '/reports',
    '/notifications',
  ],
}

export function getNavForRole(roleSlug: string): NavGroup[] {
  const allowed = ROLE_ALLOWED_HREFS[roleSlug as RoleSlug] ?? ROLE_ALLOWED_HREFS['member']
  if (allowed === '*') return mainNav

  return mainNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (allowed as string[]).some(
        (a) => item.href === a || item.href.startsWith(a + '/') || a.startsWith(item.href + '/') || a === item.href,
      )),
    }))
    .filter((group) => group.items.length > 0)
}

export const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrator',
  admin: 'Administrator',
  procurement_manager: 'Procurement Manager',
  procurement_officer: 'Procurement Officer',
  warehouse_manager: 'Warehouse Manager',
  finance_manager: 'Finance Manager',
  member: 'Member',
  viewer: 'Viewer',
}

export const SYSTEM_ROLES: RoleSlug[] = [
  'administrator',
  'procurement_manager',
  'procurement_officer',
  'warehouse_manager',
  'finance_manager',
]
