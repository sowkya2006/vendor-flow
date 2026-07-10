// ============================================================
// VendorFlow — Approval Workflow Types
// ============================================================

import type { ID } from '@/types'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type ApprovalEntityType =
  | 'vendor'
  | 'rfq'
  | 'quotation'
  | 'purchase_order'
  | 'contract'
  | 'invoice'

export type ApprovalRequestStatus =
  | 'draft'
  | 'pending_manager'
  | 'pending_procurement'
  | 'pending_finance'
  | 'pending_final'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'returned'

export type ApprovalStepStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'skipped'

export type ApprovalActionType =
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'returned'
  | 'cancelled'
  | 'reassigned'
  | 'escalated'
  | 'commented'
  | 'reopened'

export type ApprovalRole =
  | 'employee'
  | 'manager'
  | 'procurement_officer'
  | 'finance'
  | 'administrator'

export type ApprovalPriority = 'low' | 'normal' | 'high' | 'urgent'

// ---------------------------------------------------------------------------
// Workflow Templates
// ---------------------------------------------------------------------------

export interface ApprovalWorkflow {
  id: ID
  company_id: ID
  name: string
  description: string | null
  entity_type: ApprovalEntityType
  is_active: boolean
  is_default: boolean
  created_by: ID | null
  created_at: string
  updated_at: string
  steps?: ApprovalWorkflowStep[]
}

export interface ApprovalWorkflowStep {
  id: ID
  workflow_id: ID
  company_id: ID
  step_order: number
  name: string
  role_required: ApprovalRole
  approver_id: ID | null
  is_optional: boolean
  timeout_hours: number | null
  created_at: string
  updated_at: string
  approver?: {
    id: ID
    full_name: string | null
    email: string | null
    role: string
  }
}

// ---------------------------------------------------------------------------
// Approval Requests
// ---------------------------------------------------------------------------

export interface ApprovalStep {
  id: ID
  request_id: ID
  company_id: ID
  workflow_step_id: ID | null
  step_order: number
  name: string
  role_required: ApprovalRole
  approver_id: ID | null
  is_optional: boolean
  status: ApprovalStepStatus
  comments: string | null
  decided_at: string | null
  due_at: string | null
  created_at: string
  updated_at: string
  approver?: {
    id: ID
    full_name: string | null
    email: string | null
  }
}

export interface ApprovalAction {
  id: ID
  request_id: ID
  step_id: ID | null
  company_id: ID
  action_type: ApprovalActionType
  actor_id: ID | null
  comment: string | null
  is_internal: boolean
  old_status: ApprovalRequestStatus | null
  new_status: ApprovalRequestStatus | null
  metadata: Record<string, unknown> | null
  performed_at: string
  actor?: {
    id: ID
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

export interface ApprovalNotification {
  id: ID
  request_id: ID
  company_id: ID
  recipient_id: ID | null
  type: string
  title: string
  body: string
  is_read: boolean
  read_at: string | null
  sent_at: string | null
  created_at: string
}

export interface ApprovalRequest {
  id: ID
  company_id: ID
  workflow_id: ID | null
  entity_type: ApprovalEntityType
  entity_id: ID
  entity_ref: string | null
  status: ApprovalRequestStatus
  current_step: number
  total_steps: number
  amount: number | null
  currency: string
  title: string
  description: string | null
  priority: ApprovalPriority
  due_date: string | null
  requested_by: ID | null
  submitted_at: string | null
  completed_at: string | null
  rejection_reason: string | null
  return_reason: string | null
  created_at: string
  updated_at: string
  // joins
  requester?: {
    id: ID
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
  workflow?: {
    id: ID
    name: string
  }
  steps?: ApprovalStep[]
  actions?: ApprovalAction[]
}

/** Lightweight row for list views */
export type ApprovalRequestSummary = Pick<
  ApprovalRequest,
  | 'id'
  | 'entity_type'
  | 'entity_id'
  | 'entity_ref'
  | 'status'
  | 'current_step'
  | 'total_steps'
  | 'amount'
  | 'currency'
  | 'title'
  | 'priority'
  | 'due_date'
  | 'submitted_at'
  | 'created_at'
  | 'updated_at'
  | 'requested_by'
> & {
  requester?: { id: ID; full_name: string | null; email: string | null }
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

export interface CreateApprovalRequestInput {
  entity_type: ApprovalEntityType
  entity_id: ID
  entity_ref?: string
  title: string
  description?: string | null
  amount?: number | null
  currency?: string
  priority?: ApprovalPriority
  due_date?: string | null
  workflow_id?: ID | null
}

export interface ApprovalDecisionInput {
  comment?: string | null
  is_internal?: boolean
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface ApprovalFilters {
  search?: string
  status?: ApprovalRequestStatus | ''
  entity_type?: ApprovalEntityType | ''
  priority?: ApprovalPriority | ''
  mine_only?: boolean
  page?: number
  pageSize?: number
}

export interface ApprovalListResult {
  data: ApprovalRequestSummary[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export interface ApprovalStats {
  total: number
  pending: number
  approved_today: number
  rejected_today: number
  awaiting_my_approval: number
  completion_rate: number
  avg_approval_hours: number | null
}

// ---------------------------------------------------------------------------
// Labels & mappings
// ---------------------------------------------------------------------------

export const APPROVAL_STATUS_LABELS: Record<ApprovalRequestStatus, string> = {
  draft: 'Draft',
  pending_manager: 'Pending Manager',
  pending_procurement: 'Pending Procurement',
  pending_finance: 'Pending Finance',
  pending_final: 'Pending Final Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
  returned: 'Returned',
}

export const APPROVAL_ENTITY_LABELS: Record<ApprovalEntityType, string> = {
  vendor: 'Vendor',
  rfq: 'RFQ',
  quotation: 'Quotation',
  purchase_order: 'Purchase Order',
  contract: 'Contract',
  invoice: 'Invoice',
}

export const APPROVAL_ROLE_LABELS: Record<ApprovalRole, string> = {
  employee: 'Employee',
  manager: 'Manager',
  procurement_officer: 'Procurement Officer',
  finance: 'Finance',
  administrator: 'Administrator',
}

export const APPROVAL_PRIORITY_LABELS: Record<ApprovalPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

export const APPROVAL_ACTION_LABELS: Record<ApprovalActionType, string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  returned: 'Returned for Revision',
  cancelled: 'Cancelled',
  reassigned: 'Reassigned',
  escalated: 'Escalated',
  commented: 'Commented',
  reopened: 'Reopened',
}
