'use server'

import { redirect } from 'next/navigation'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  createApprovalRequest,
  submitApprovalRequest,
  approveStep,
  rejectRequest,
  returnRequest,
  cancelRequest,
  addApprovalComment,
  markNotificationsRead,
  getEntityRecords,
  getApprovalRequestById,
} from '@/lib/supabase/approvals'
import {
  createApprovalRequestSchema,
  rejectApprovalSchema,
  returnApprovalSchema,
} from '@/lib/validations/approval'
import type { CreateApprovalRequestValues } from '@/lib/validations/approval'
import type { ApprovalEntityType } from '@/types/approval'
import type { EntityRecord } from '@/lib/supabase/approvals'
import { syncEntityStatusAfterApproval } from '@/lib/supabase/auto-approve'
import { guardPermission } from '@/lib/supabase/permission-guard'

// ---------------------------------------------------------------------------
// Helper — authenticated user (cached per request via get-auth)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// getEntityRecordsAction — loads records for the entity selector in the form
// ---------------------------------------------------------------------------
export async function getEntityRecordsAction(
  entityType: ApprovalEntityType,
): Promise<EntityRecord[]> {
  const companyId = await getCompanyId()
  return getEntityRecords(companyId, entityType)
}

// ---------------------------------------------------------------------------
// createApprovalRequestAction
// ---------------------------------------------------------------------------
export async function createApprovalRequestAction(
  values: CreateApprovalRequestValues,
): Promise<{ success: false; error: string } | { success: true; id: string }> {
  const parsed = createApprovalRequestSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid form data' }
  }

  try {
    const user = await getUser()
    const companyId = await getCompanyId()
    const request = await createApprovalRequest(companyId, user.id, parsed.data)

    // Immediately submit the draft so it enters the workflow
    await submitApprovalRequest(request.id, companyId, user.id)

    return { success: true, id: request.id }
  } catch (err) {
    return { success: false, error: (err as Error).message ?? 'Failed to create approval request' }
  }
}

// ---------------------------------------------------------------------------
// submitApprovalRequestAction — draft → first pending step
// ---------------------------------------------------------------------------
export async function submitApprovalRequestAction(requestId: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await submitApprovalRequest(requestId, companyId, user.id)
  redirect(`/approvals/${requestId}`)
}

// ---------------------------------------------------------------------------
// approveStepAction
// ---------------------------------------------------------------------------
export async function approveStepAction(
  requestId: string,
  stepId: string,
  comment: string | null,
  isInternal: boolean,
) {
  const user = await getUser()
  const companyId = await getCompanyId()
  // Load the request to know what entity type we're approving
  const req = await getApprovalRequestById(requestId, companyId)
  if (req) {
    const permMap: Partial<Record<string, string>> = {
      rfq: 'approve_rfqs',
      quotation: 'approve_quotations',
      purchase_order: 'approve_purchase_orders',
    }
    const neededPerm = permMap[req.entity_type]
    if (neededPerm) await guardPermission(neededPerm)
  }
  await approveStep(requestId, stepId, companyId, user.id, comment, isInternal)

  // Sync entity status if the whole request is now fully approved
  const updatedRequest = await getApprovalRequestById(requestId, companyId)
  if (updatedRequest?.status === 'approved' && updatedRequest.entity_id) {
    await syncEntityStatusAfterApproval(
      companyId,
      updatedRequest.entity_type as ApprovalEntityType,
      updatedRequest.entity_id,
      'approved',
    )
  }

  redirect(`/approvals/${requestId}`)
}

// ---------------------------------------------------------------------------
// rejectRequestAction
// ---------------------------------------------------------------------------
export async function rejectRequestAction(
  requestId: string,
  stepId: string | null,
  reason: string,
) {
  const parsed = rejectApprovalSchema.safeParse({ reason })
  if (!parsed.success) throw new Error('Rejection reason is required')

  const user = await getUser()
  const companyId = await getCompanyId()
  await rejectRequest(requestId, stepId, companyId, user.id, parsed.data.reason)

  // Sync entity status to rejected
  const updatedRequest = await getApprovalRequestById(requestId, companyId)
  if (updatedRequest?.entity_id) {
    await syncEntityStatusAfterApproval(
      companyId,
      updatedRequest.entity_type as ApprovalEntityType,
      updatedRequest.entity_id,
      'rejected',
    )
  }

  redirect(`/approvals/${requestId}`)
}

// ---------------------------------------------------------------------------
// returnRequestAction
// ---------------------------------------------------------------------------
export async function returnRequestAction(
  requestId: string,
  stepId: string | null,
  reason: string,
) {
  const parsed = returnApprovalSchema.safeParse({ reason })
  if (!parsed.success) throw new Error('Return reason is required')

  const user = await getUser()
  const companyId = await getCompanyId()
  await returnRequest(requestId, stepId, companyId, user.id, parsed.data.reason)

  // Sync entity status back to draft so the creator can revise
  const updatedRequest = await getApprovalRequestById(requestId, companyId)
  if (updatedRequest?.entity_id) {
    await syncEntityStatusAfterApproval(
      companyId,
      updatedRequest.entity_type as ApprovalEntityType,
      updatedRequest.entity_id,
      'returned',
    )
  }

  redirect(`/approvals/${requestId}`)
}

// ---------------------------------------------------------------------------
// cancelRequestAction
// ---------------------------------------------------------------------------
export async function cancelRequestAction(requestId: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await cancelRequest(requestId, companyId, user.id)
  redirect(`/approvals/${requestId}`)
}

// ---------------------------------------------------------------------------
// addCommentAction
// ---------------------------------------------------------------------------
export async function addCommentAction(
  requestId: string,
  comment: string,
  isInternal: boolean,
) {
  if (!comment.trim()) throw new Error('Comment cannot be empty')
  const user = await getUser()
  const companyId = await getCompanyId()
  await addApprovalComment(requestId, companyId, user.id, comment.trim(), isInternal)
}

// ---------------------------------------------------------------------------
// markNotificationsReadAction
// ---------------------------------------------------------------------------
export async function markNotificationsReadAction() {
  const user = await getUser()
  const companyId = await getCompanyId()
  await markNotificationsRead(companyId, user.id)
}
