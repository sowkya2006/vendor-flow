/**
 * auto-approve.ts
 *
 * The Approval Workflow module has been removed from VendorFlow.
 * This file is kept as a no-op stub so any existing imports don't break.
 * All functions return safe defaults and perform no DB operations.
 */
import type { ApprovalEntityType } from '@/types/approval'

export interface AutoApproveInput {
  companyId: string
  userId: string
  entityType: ApprovalEntityType
  entityId: string
  entityRef: string
  title: string
  amount?: number | null
  currency?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

/** Always returns false — no workflows exist */
export async function hasApprovalWorkflow(
  _companyId: string,
  _entityType: ApprovalEntityType,
): Promise<boolean> {
  return false
}

/** No-op — workflow module removed. Always returns null. */
export async function triggerApproval(_input: AutoApproveInput): Promise<string | null> {
  return null
}

/** No-op — workflow module removed. */
export async function syncEntityStatusAfterApproval(
  _companyId: string,
  _entityType: ApprovalEntityType,
  _entityId: string,
  _approvalStatus: 'approved' | 'rejected' | 'returned',
): Promise<void> {
  // no-op
}
