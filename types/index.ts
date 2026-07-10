// ============================================================
// VendorFlow — Global TypeScript Types
// All shared types live here. Module-specific types go in
// their own files (e.g., types/vendor.ts) as they are built.
// ============================================================

export type ID = string

export interface User {
  id: ID
  name: string
  email: string
  avatar?: string
  role: UserRole
  workspaceId: ID
  createdAt: string
  updatedAt: string
}

export type UserRole = 'owner' | 'admin' | 'administrator' | 'manager' | 'viewer' |
  'procurement_manager' | 'procurement_officer' | 'warehouse_manager' | 'finance_manager' | 'member'

export interface Workspace {
  id: ID
  name: string
  slug: string
  logo?: string
  plan: WorkspacePlan
  createdAt: string
  updatedAt: string
}

export type WorkspacePlan = 'free' | 'starter' | 'growth' | 'enterprise'

// Generic paginated API response
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

// Generic API error
export interface ApiError {
  message: string
  code?: string
  status?: number
}

// Status types used across multiple modules
export type StatusBadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'

// Navigation item shape
export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavItem[]
}
