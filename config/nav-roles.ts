/**
 * nav-roles.ts — Single source of truth for role-based access control.
 *
 * Role rules (per spec):
 * ─ Administrator      : Full access.
 * ─ Procurement Manager: Approvals + Insights (Procurement/Vendor/Approval). No Finance/Inventory/Employees/Roles.
 * ─ Procurement Officer: RFQs + POs + Insights (Procurement/Vendor). No Approvals/Finance/Warehouse/Employees/Roles.
 * ─ Finance Manager    : Finance only + Finance Insights. No Procurement/Warehouse/Employees/Roles.
 * ─ Warehouse Manager  : Inventory only + Inventory Insights. No Finance/Procurement/Employees/Roles.
 *
 * Workspace is visible to ALL employee roles (read-only for non-admin).
 * Employees & Roles & Permissions are ADMIN ONLY.
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
  | 'viewer'

// ─────────────────────────────────────────────────────────────────────────────
// Allowed sidebar hrefs per role — strict allow-list
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_ALLOWED_HREFS: Record<RoleSlug, string[] | '*'> = {

  // ── Administrator ────────────────────────────────────────────────────────
  administrator: '*',
  admin:         '*',

  // ── Procurement Manager ──────────────────────────────────────────────────
  // Dashboard | Notifications
  // Approvals: Approvals list, Pending — NO Workflows, NO Audit Log (admin only)
  // Insights: Procurement, Vendor, Approvals analytics
  // System: Settings, Workspace (read-only)
  // HIDE: Finance, Inventory/Warehouse, Employees, Roles & Permissions, Workflow, Audit Log
  procurement_manager: [
    '/dashboard',
    '/notifications',
    // Procurement — review RFQs, approve quotations, approve POs
    '/rfqs',
    '/quotations',
    '/purchase-orders',
    // Approvals — NO audit-log (admin only)
    '/approvals',
    '/approvals/history',
    // Insights — relevant only
    '/analytics/procurement',
    '/analytics/vendors',
    '/analytics/approvals',
    // System
    '/settings',
    '/settings/workspace',
  ],

  // ── Procurement Officer ──────────────────────────────────────────────────
  // Dashboard | Notifications
  // RFQs | Purchase Orders
  // Insights: Procurement, Vendor analytics
  // System: Settings, Workspace (read-only)
  // HIDE: Finance, Inventory, Approvals, Employees, Roles & Permissions
  procurement_officer: [
    '/dashboard',
    '/notifications',
    '/rfqs',
    '/purchase-orders',
    // Insights — relevant only
    '/analytics/procurement',
    '/analytics/vendors',
    // System
    '/settings',
    '/settings/workspace',
  ],

  // ── Finance Manager ──────────────────────────────────────────────────────
  // Dashboard | Notifications
  // Finance: Dashboard, Invoices, Outstanding, Overdue, Payment History, Vendor Balances
  // Insights: Finance analytics only
  // System: Settings, Workspace (read-only)
  // HIDE: Procurement, Inventory, Approvals, Employees, Roles & Permissions
  finance_manager: [
    '/dashboard',
    '/notifications',
    '/payments',
    '/payments/invoices',
    '/payments/outstanding',
    '/payments/overdue',
    '/payments/history',
    '/payments/vendors',
    // Insights — relevant only
    '/analytics/finance',
    // System
    '/settings',
    '/settings/workspace',
  ],

  // ── Warehouse Manager ────────────────────────────────────────────────────
  // Dashboard | Notifications
  // Inventory: Warehouses, GRNs, Stock, Transactions
  // Insights: Inventory analytics only
  // System: Settings, Workspace (read-only)
  // HIDE: Finance, Procurement, Approvals, Employees, Roles & Permissions
  warehouse_manager: [
    '/dashboard',
    '/notifications',
    '/inventory',
    '/inventory/warehouses',
    '/inventory/grn',
    '/inventory/transactions',
    // Insights — relevant only
    '/analytics/inventory',
    // System
    '/settings',
    '/settings/workspace',
  ],

  viewer: [
    '/dashboard',
    '/notifications',
    '/settings',
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar filtering logic
// ─────────────────────────────────────────────────────────────────────────────

// Items that should use EXACT match only — no startsWith parent detection.
// This prevents /analytics from being highlighted when on /analytics/procurement.
const EXACT_MATCH_HREFS = new Set([
  '/analytics',
  '/settings',
  '/settings/employees',
  '/settings/roles',
  '/approvals',
  '/inventory',
  '/payments',
])

function hrefAllowed(itemHref: string, allowed: string[]): boolean {
  // Direct match — always allow if explicitly listed
  if (allowed.includes(itemHref)) return true

  // For items in the EXACT_MATCH set — only show if explicitly in allowed list
  // This prevents showing /analytics when only /analytics/procurement is allowed,
  // AND prevents showing /settings/employees when only /settings is allowed.
  if (EXACT_MATCH_HREFS.has(itemHref)) return false

  return allowed.some((a) => {
    // Item is a child of an allowed path: e.g. /payments/invoices when /payments is allowed
    if (itemHref.startsWith(a + '/')) return true
    // Allowed is a child of item: e.g. /settings when /settings/workspace is allowed
    // BUT only if the item itself is NOT in the exact-match set (already handled above)
    // AND the item is a short prefix (to avoid /settings showing /settings/employees)
    // We only allow parent-showing for items that have ONE segment (e.g. /settings, /payments)
    // and where the child is a direct child, not a grandchild of a blocked parent
    const itemSegments = itemHref.split('/').filter(Boolean).length
    if (itemSegments === 1 && a.startsWith(itemHref + '/')) return true
    return false
  })
}

export function getNavForRole(roleSlug: string): NavGroup[] {
  const normalised = roleSlug === 'admin' ? 'administrator' : roleSlug
  const allowed = ROLE_ALLOWED_HREFS[normalised as RoleSlug] ?? ROLE_ALLOWED_HREFS['viewer']
  if (allowed === '*') return mainNav
  return mainNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hrefAllowed(item.href, allowed as string[])),
    }))
    .filter((group) => group.items.length > 0)
}

// ─────────────────────────────────────────────────────────────────────────────
// Role permissions — enforced in server actions
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  administrator: ['*'],
  admin:         ['*'],

  procurement_officer: [
    'manage_rfqs',
    'manage_purchase_orders',
    'view_reports',
  ],

  procurement_manager: [
    'approve_rfqs',
    'approve_quotations',
    'approve_purchase_orders',
    'view_reports',
  ],

  warehouse_manager: [
    'manage_inventory',
    'view_reports',
  ],

  finance_manager: [
    'manage_invoices',
    'manage_payments',
    'finance_access',
    'view_reports',
    'export_data',
  ],

  viewer: ['view_reports'],
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics access per role
// ─────────────────────────────────────────────────────────────────────────────
export const ROLE_ANALYTICS_PATHS: Record<string, string[]> = {
  administrator:       ['/analytics', '/analytics/procurement', '/analytics/vendors', '/analytics/inventory', '/analytics/finance', '/analytics/approvals'],
  admin:               ['/analytics', '/analytics/procurement', '/analytics/vendors', '/analytics/inventory', '/analytics/finance', '/analytics/approvals'],
  procurement_manager: ['/analytics/procurement', '/analytics/vendors', '/analytics/approvals'],
  procurement_officer: ['/analytics/procurement', '/analytics/vendors'],
  finance_manager:     ['/analytics/finance'],
  warehouse_manager:   ['/analytics/inventory'],
  viewer:              [],
}

/** Returns the first analytics path this role can access. */
export function getAnalyticsDefaultPath(role: string): string {
  const normalised = role === 'admin' ? 'administrator' : role
  const paths = ROLE_ANALYTICS_PATHS[normalised] ?? []
  return paths[0] ?? '/dashboard'
}

// ─────────────────────────────────────────────────────────────────────────────
// Route protection — pages that require specific roles
// ─────────────────────────────────────────────────────────────────────────────

/** Pages that require Administrator role */
export const ADMIN_ONLY_PATHS = [
  '/settings/employees',
  '/settings/roles',
  '/audit-log',
]

/** Maps path prefixes to roles that are allowed */
export const ROUTE_ROLE_GUARDS: { prefix: string; roles: string[] }[] = [
  { prefix: '/settings/employees',   roles: ['administrator', 'admin'] },
  { prefix: '/settings/roles',        roles: ['administrator', 'admin'] },
  { prefix: '/audit-log',             roles: ['administrator', 'admin'] },
  { prefix: '/rfqs/new',              roles: ['administrator', 'admin', 'procurement_officer'] },
  { prefix: '/purchase-orders/new',   roles: ['administrator', 'admin', 'procurement_officer'] },
  { prefix: '/quotations/new',        roles: [] }, // No one — vendor portal only
  { prefix: '/approvals',             roles: ['administrator', 'admin', 'procurement_manager'] },
  { prefix: '/payments',              roles: ['administrator', 'admin', 'finance_manager'] },
  { prefix: '/inventory',             roles: ['administrator', 'admin', 'warehouse_manager'] },
  { prefix: '/analytics',             roles: ['administrator', 'admin', 'procurement_manager', 'procurement_officer', 'finance_manager', 'warehouse_manager'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Permission helpers
// ─────────────────────────────────────────────────────────────────────────────

export function requirePermission(roleSlug: string, permission: string): void {
  const normalised = roleSlug === 'admin' ? 'administrator' : roleSlug
  const perms = ROLE_PERMISSIONS[normalised] ?? ROLE_PERMISSIONS['viewer']
  if (perms.includes('*')) return
  if (!perms.includes(permission)) {
    throw new Error(`FORBIDDEN: role '${normalised}' does not have permission '${permission}'`)
  }
}

export function roleHasPermission(roleSlug: string, permission: string): boolean {
  const normalised = roleSlug === 'admin' ? 'administrator' : roleSlug
  const perms = ROLE_PERMISSIONS[normalised] ?? ROLE_PERMISSIONS['viewer']
  return perms.includes('*') || perms.includes(permission)
}

export function canCreateRFQ(role: string): boolean {
  return roleHasPermission(role, 'manage_rfqs')
}

export function canCreatePO(role: string): boolean {
  return roleHasPermission(role, 'manage_purchase_orders')
}

export function canCreateQuotation(_role: string): boolean {
  return false
}

export function canApprove(role: string): boolean {
  return roleHasPermission(role, 'approve_rfqs') ||
    roleHasPermission(role, 'approve_quotations') ||
    roleHasPermission(role, 'approve_purchase_orders')
}

export const ROLE_LABELS: Record<string, string> = {
  administrator:       'Administrator',
  admin:               'Administrator',
  procurement_manager: 'Procurement Manager',
  procurement_officer: 'Procurement Officer',
  warehouse_manager:   'Warehouse Manager',
  finance_manager:     'Finance Manager',
  viewer:              'Viewer',
}

export const SYSTEM_ROLES: RoleSlug[] = [
  'administrator',
  'procurement_manager',
  'procurement_officer',
  'warehouse_manager',
  'finance_manager',
]
