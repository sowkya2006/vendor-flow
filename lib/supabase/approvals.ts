import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type {
  ApprovalRequest,
  ApprovalRequestSummary,
  ApprovalWorkflow,
  ApprovalStats,
  ApprovalFilters,
  ApprovalListResult,
  ApprovalRequestStatus,
  ApprovalEntityType,
  CreateApprovalRequestInput,
} from '@/types/approval'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as {
    from: (table: string) => any
    rpc: (fn: string, args?: any) => any
  }
}

const REQUEST_SUMMARY_SELECT = `
  id, entity_type, entity_id, entity_ref, status, current_step, total_steps,
  amount, currency, title, priority, due_date, submitted_at, created_at, updated_at, requested_by,
  requester:users!approval_requests_requested_by_fkey ( id, full_name, email )
`

const REQUEST_DETAIL_SELECT = `
  *,
  requester:users!approval_requests_requested_by_fkey ( id, full_name, email, avatar_url ),
  workflow:approval_workflows ( id, name ),
  steps:approval_steps (
    *,
    approver:users!approval_steps_approver_id_fkey ( id, full_name, email )
  ),
  actions:approval_actions (
    *,
    actor:users!approval_actions_actor_id_fkey ( id, full_name, email, avatar_url )
  )
`

// ---------------------------------------------------------------------------
// getApprovalRequests — paginated list
// ---------------------------------------------------------------------------
export async function getApprovalRequests(
  companyId: string,
  filters: ApprovalFilters = {},
): Promise<ApprovalListResult> {
  const supabase = await db()
  const { search, status, entity_type, priority, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('approval_requests')
    .select(REQUEST_SUMMARY_SELECT, { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (entity_type) query = query.eq('entity_type', entity_type)
  if (priority) query = query.eq('priority', priority)
  if (search) query = query.or(`title.ilike.%${search}%,entity_ref.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as ApprovalRequestSummary[],
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

// ---------------------------------------------------------------------------
// getPendingApprovals — items awaiting a specific user's action
// ---------------------------------------------------------------------------
export async function getPendingApprovals(
  companyId: string,
  userId: string,
  filters: ApprovalFilters = {},
): Promise<ApprovalListResult> {
  const supabase = await db()
  const { search, entity_type, priority, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Get request IDs where this user has a pending step
  const { data: pendingSteps, error: stepsErr } = await supabase
    .from('approval_steps')
    .select('request_id')
    .eq('company_id', companyId)
    .eq('approver_id', userId)
    .eq('status', 'pending')

  if (stepsErr) throw stepsErr
  const pendingIds = (pendingSteps ?? []).map((s: { request_id: string }) => s.request_id)

  if (pendingIds.length === 0) {
    return { data: [], total: 0, page, pageSize, hasNextPage: false }
  }

  let query = supabase
    .from('approval_requests')
    .select(REQUEST_SUMMARY_SELECT, { count: 'exact' })
    .eq('company_id', companyId)
    .in('id', pendingIds)
    .not('status', 'in', '("approved","rejected","cancelled","completed")')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (entity_type) query = query.eq('entity_type', entity_type)
  if (priority) query = query.eq('priority', priority)
  if (search) query = query.or(`title.ilike.%${search}%,entity_ref.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as ApprovalRequestSummary[],
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

// ---------------------------------------------------------------------------
// getApprovalHistory — completed / rejected / cancelled
// ---------------------------------------------------------------------------
export async function getApprovalHistory(
  companyId: string,
  filters: ApprovalFilters = {},
): Promise<ApprovalListResult> {
  const supabase = await db()
  const { search, entity_type, priority, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('approval_requests')
    .select(REQUEST_SUMMARY_SELECT, { count: 'exact' })
    .eq('company_id', companyId)
    .in('status', ['approved', 'rejected', 'cancelled', 'completed', 'returned'])
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (entity_type) query = query.eq('entity_type', entity_type)
  if (priority) query = query.eq('priority', priority)
  if (search) query = query.or(`title.ilike.%${search}%,entity_ref.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as ApprovalRequestSummary[],
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

// ---------------------------------------------------------------------------
// getApprovalRequestById
// ---------------------------------------------------------------------------
export async function getApprovalRequestById(
  id: string,
  companyId: string,
): Promise<ApprovalRequest | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('approval_requests')
    .select(REQUEST_DETAIL_SELECT)
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Sort steps and actions
  if (data?.steps) data.steps.sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order)
  if (data?.actions) data.actions.sort((a: { performed_at: string }, b: { performed_at: string }) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime())

  return data as ApprovalRequest
}

// ---------------------------------------------------------------------------
// createApprovalRequest
// ---------------------------------------------------------------------------
export async function createApprovalRequest(
  companyId: string,
  userId: string,
  input: CreateApprovalRequestInput,
): Promise<ApprovalRequest> {
  const supabase = await db()

  // Find default workflow for entity type if not specified
  let workflowId = input.workflow_id ?? null
  if (!workflowId) {
    const { data: wf } = await supabase
      .from('approval_workflows')
      .select('id')
      .eq('company_id', companyId)
      .eq('entity_type', input.entity_type)
      .eq('is_default', true)
      .eq('is_active', true)
      .single()
    workflowId = wf?.id ?? null
  }

  // Load workflow steps
  let workflowSteps: Array<{ id: string; step_order: number; name: string; role_required: string; approver_id: string | null; is_optional: boolean; timeout_hours: number | null }> = []
  if (workflowId) {
    const { data: steps } = await supabase
      .from('approval_workflow_steps')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('step_order')
    workflowSteps = steps ?? []
  }

  // Insert request
  const { data: request, error } = await supabase
    .from('approval_requests')
    .insert({
      company_id: companyId,
      workflow_id: workflowId,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      entity_ref: input.entity_ref ?? null,
      title: input.title,
      description: input.description ?? null,
      amount: input.amount ?? null,
      currency: input.currency ?? 'INR',
      priority: input.priority ?? 'normal',
      due_date: input.due_date ?? null,
      requested_by: userId,
      status: 'draft',
      total_steps: workflowSteps.length,
      current_step: 0,
    })
    .select()
    .single()

  if (error) throw error

  // Create step rows
  if (workflowSteps.length > 0) {
    const stepRows = workflowSteps.map((ws) => ({
      request_id: request.id,
      company_id: companyId,
      workflow_step_id: ws.id,
      step_order: ws.step_order,
      name: ws.name,
      role_required: ws.role_required,
      approver_id: ws.approver_id,
      is_optional: ws.is_optional,
      status: 'pending',
      due_at: ws.timeout_hours
        ? new Date(Date.now() + ws.timeout_hours * 3600 * 1000).toISOString()
        : null,
    }))
    const { error: stepErr } = await supabase.from('approval_steps').insert(stepRows)
    if (stepErr) throw stepErr
  }

  // Log action
  await logAction(supabase, request.id, companyId, userId, 'submitted', null, 'draft' as ApprovalRequestStatus, null)

  return request as ApprovalRequest
}

// ---------------------------------------------------------------------------
// submitApprovalRequest — draft → first pending status
// ---------------------------------------------------------------------------
export async function submitApprovalRequest(
  id: string,
  companyId: string,
  userId: string,
): Promise<ApprovalRequest> {
  const supabase = await db()

  // Find first step
  const { data: firstStep } = await supabase
    .from('approval_steps')
    .select('*')
    .eq('request_id', id)
    .order('step_order')
    .limit(1)
    .single()

  const newStatus = firstStep
    ? roleToStatus(firstStep.role_required)
    : 'pending_manager' as ApprovalRequestStatus

  const { data, error } = await supabase
    .from('approval_requests')
    .update({
      status: newStatus,
      submitted_at: new Date().toISOString(),
      current_step: firstStep?.step_order ?? 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) throw error

  await logAction(supabase, id, companyId, userId, 'submitted', 'draft', newStatus, null)

  // Notify the next approver (specific user if assigned, else all users with that role)
  // + notify the admin for oversight
  // + send email to the notified parties
  try {
    const adminDb = createAdminClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any

    // Determine the first step's role
    const stepRole = firstStep?.role_required ?? 'procurement_manager'
    const approverRoles = new Set<string>(['administrator', stepRole])

    // Fetch all active users with those roles
    const { data: roleUsers } = await adminDb
      .from('users')
      .select('id, email, full_name, role')
      .eq('company_id', companyId)
      .in('role', Array.from(approverRoles))
      .eq('status', 'active')

    const recipients: { id: string; email: string | null; full_name: string | null }[] = roleUsers ?? []

    // If a specific approver is assigned for this step, ensure they're included
    if (firstStep?.approver_id) {
      const already = recipients.some((r) => r.id === firstStep.approver_id)
      if (!already) {
        const { data: approver } = await adminDb
          .from('users')
          .select('id, email, full_name')
          .eq('id', firstStep.approver_id)
          .maybeSingle()
        if (approver) recipients.push(approver as { id: string; email: string | null; full_name: string | null })
      }
    }

    if (recipients.length > 0) {
      const title  = `Approval Required: ${data.title}`
      const body   = `A new approval request "${data.title}" has been submitted and requires your review.`
      const link   = `/approvals/${id}`
      const ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}${link}`

      // In-app notifications
      const rows = recipients.map((r) => ({
        request_id:   id,
        company_id:   companyId,
        recipient_id: r.id,
        type:         'approval_required',
        title,
        body,
        link,
        entity_type:  'approval_request',
        entity_id:    id,
        is_read:      false,
        sent_at:      new Date().toISOString(),
      }))
      await adminDb.from('approval_notifications').insert(rows)

      // Emails
      const { sendApprovalEmail } = await import('@/lib/notifications/engine')
      await Promise.allSettled(
        recipients
          .filter((r) => r.email)
          .map((r) =>
            sendApprovalEmail(
              r.email!,
              `Approval Required: ${data.title}`,
              body,
              ctaUrl,
              r.full_name ?? undefined,
            )
          )
      )
    }
  } catch { /* non-critical */ }

  return data as ApprovalRequest
}

// ---------------------------------------------------------------------------
// approveStep
// ---------------------------------------------------------------------------
export async function approveStep(
  requestId: string,
  stepId: string,
  companyId: string,
  userId: string,
  comment: string | null,
  isInternal = false,
): Promise<ApprovalRequest> {
  const supabase = await db()

  const oldRequest = await getApprovalRequestById(requestId, companyId)
  if (!oldRequest) throw new Error('Request not found')

  // Mark step approved
  const { error: stepErr } = await supabase
    .from('approval_steps')
    .update({ status: 'approved', comments: comment, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', stepId)
    .eq('company_id', companyId)
  if (stepErr) throw stepErr

  // Log action
  await logAction(supabase, requestId, companyId, userId, 'approved', oldRequest.status, null, comment, stepId, isInternal)

  // Advance workflow
  await supabase.rpc('advance_approval_request', { p_request_id: requestId })

  const updated = await getApprovalRequestById(requestId, companyId)
  if (!updated) throw new Error('Request not found after advance')

  // Notify next approver if still pending, or notify submitter + admin on final approval
  try {
    const adminDb = createAdminClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const { sendApprovalEmail } = await import('@/lib/notifications/engine')

    if (!['approved', 'rejected', 'cancelled', 'completed'].includes(updated.status)) {
      // Workflow still in progress — notify next step's approver(s)
      const nextStep = updated.steps?.find((s: { status: string }) => s.status === 'pending')
      const nextRole = nextStep?.role_required
      const nextApproverId = nextStep?.approver_id ?? null

      const recipientIds = new Set<string>()
      if (nextApproverId) recipientIds.add(nextApproverId)

      if (nextRole) {
        const { data: roleUsers } = await adminDb
          .from('users').select('id, email, full_name')
          .eq('company_id', companyId).eq('role', nextRole).eq('status', 'active')
        for (const u of (roleUsers ?? []) as { id: string; email: string | null; full_name: string | null }[]) {
          recipientIds.add(u.id)
        }
      }

      if (recipientIds.size > 0) {
        const { data: recUsers } = await adminDb
          .from('users').select('id, email, full_name')
          .eq('company_id', companyId).in('id', Array.from(recipientIds))
        const recs = (recUsers ?? []) as { id: string; email: string | null; full_name: string | null }[]
        const title = `Your Approval Required: ${updated.title}`
        const body  = `Step ${nextStep?.step_order ?? ''}: "${nextStep?.name ?? 'Next approval step'}" is waiting for your decision on "${updated.title}".`
        const link  = `/approvals/${requestId}`
        await adminDb.from('approval_notifications').insert(
          recs.map((r) => ({ request_id: requestId, company_id: companyId, recipient_id: r.id, type: 'approval_required', title, body, link, entity_type: 'approval_request', entity_id: requestId, is_read: false, sent_at: new Date().toISOString() }))
        )
        await Promise.allSettled(
          recs.filter((r) => r.email).map((r) => sendApprovalEmail(r.email!, title, body, `${appUrl}${link}`, r.full_name ?? undefined))
        )
      }

    } else if (updated.status === 'approved') {
      // Final approval — notify submitter + procurement_officer + admin
      const notifyRoles = new Set(['administrator', 'procurement_officer', 'procurement_manager'])
      const recipientIds = new Set<string>()
      if (updated.requested_by) recipientIds.add(updated.requested_by)

      const { data: roleUsers } = await adminDb
        .from('users').select('id, email, full_name')
        .eq('company_id', companyId).in('role', Array.from(notifyRoles)).eq('status', 'active')
      for (const u of (roleUsers ?? []) as { id: string; email: string | null; full_name: string | null }[]) {
        recipientIds.add(u.id)
      }

      if (recipientIds.size > 0) {
        const { data: recUsers } = await adminDb
          .from('users').select('id, email, full_name')
          .in('id', Array.from(recipientIds))
        const recs = (recUsers ?? []) as { id: string; email: string | null; full_name: string | null }[]
        const title = `Approved: ${updated.title}`
        const body  = `The approval request "${updated.title}" has been fully approved.`
        const link  = `/approvals/${requestId}`
        await adminDb.from('approval_notifications').insert(
          recs.map((r) => ({ request_id: requestId, company_id: companyId, recipient_id: r.id, type: 'approved', title, body, link, entity_type: 'approval_request', entity_id: requestId, is_read: false, sent_at: new Date().toISOString() }))
        )
        await Promise.allSettled(
          recs.filter((r) => r.email).map((r) => sendApprovalEmail(r.email!, title, body, `${appUrl}${link}`, r.full_name ?? undefined))
        )
      }
    }
  } catch { /* non-critical */ }

  return updated
}

// ---------------------------------------------------------------------------
// rejectRequest
// ---------------------------------------------------------------------------
export async function rejectRequest(
  requestId: string,
  stepId: string | null,
  companyId: string,
  userId: string,
  reason: string,
  isInternal = false,
): Promise<ApprovalRequest> {
  const supabase = await db()

  const old = await getApprovalRequestById(requestId, companyId)
  if (!old) throw new Error('Request not found')

  if (stepId) {
    await supabase
      .from('approval_steps')
      .update({ status: 'rejected', comments: reason, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', stepId)
      .eq('company_id', companyId)
  }

  const { data, error } = await supabase
    .from('approval_requests')
    .update({ status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) throw error

  await logAction(supabase, requestId, companyId, userId, 'rejected', old.status, 'rejected', reason, stepId ?? undefined, isInternal)

  // Notify submitter + procurement roles + admin with email
  try {
    const adminDb = createAdminClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const { sendApprovalEmail } = await import('@/lib/notifications/engine')

    const recipientIds = new Set<string>()
    if (old.requested_by) recipientIds.add(old.requested_by)

    const { data: roleUsers } = await adminDb
      .from('users').select('id, email, full_name')
      .eq('company_id', companyId)
      .in('role', ['administrator', 'procurement_officer', 'procurement_manager'])
      .eq('status', 'active')
    for (const u of (roleUsers ?? []) as { id: string; email: string | null; full_name: string | null }[]) {
      recipientIds.add(u.id)
    }

    if (recipientIds.size > 0) {
      const { data: recUsers } = await adminDb.from('users').select('id, email, full_name').in('id', Array.from(recipientIds))
      const recs = (recUsers ?? []) as { id: string; email: string | null; full_name: string | null }[]
      const title = `Rejected: ${old.title}`
      const body  = `The approval request "${old.title}" was rejected. Reason: ${reason}`
      const link  = `/approvals/${requestId}`
      await adminDb.from('approval_notifications').insert(
        recs.map((r) => ({ request_id: requestId, company_id: companyId, recipient_id: r.id, type: 'rejected', title, body, link, entity_type: 'approval_request', entity_id: requestId, is_read: false, sent_at: new Date().toISOString() }))
      )
      await Promise.allSettled(
        recs.filter((r) => r.email).map((r) => sendApprovalEmail(r.email!, title, body, `${appUrl}${link}`, r.full_name ?? undefined))
      )
    }
  } catch { /* non-critical */ }

  return data as ApprovalRequest
}

// ---------------------------------------------------------------------------
// returnRequest — send back for revision
// ---------------------------------------------------------------------------
export async function returnRequest(
  requestId: string,
  stepId: string | null,
  companyId: string,
  userId: string,
  reason: string,
): Promise<ApprovalRequest> {
  const supabase = await db()

  const old = await getApprovalRequestById(requestId, companyId)
  if (!old) throw new Error('Request not found')

  if (stepId) {
    await supabase
      .from('approval_steps')
      .update({ status: 'returned', comments: reason, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', stepId)
      .eq('company_id', companyId)
  }

  const { data, error } = await supabase
    .from('approval_requests')
    .update({ status: 'returned', return_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) throw error

  await logAction(supabase, requestId, companyId, userId, 'returned', old.status, 'returned', reason, stepId ?? undefined)

  // Notify submitter + admin with email
  try {
    const adminDb = createAdminClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const { sendApprovalEmail } = await import('@/lib/notifications/engine')

    const recipientIds = new Set<string>()
    if (old.requested_by) recipientIds.add(old.requested_by)

    const { data: adminUsers } = await adminDb
      .from('users').select('id, email, full_name')
      .eq('company_id', companyId).eq('role', 'administrator').eq('status', 'active')
    for (const u of (adminUsers ?? []) as { id: string; email: string | null; full_name: string | null }[]) {
      recipientIds.add(u.id)
    }

    if (recipientIds.size > 0) {
      const { data: recUsers } = await adminDb.from('users').select('id, email, full_name').in('id', Array.from(recipientIds))
      const recs = (recUsers ?? []) as { id: string; email: string | null; full_name: string | null }[]
      const title = `Returned for Revision: ${old.title}`
      const body  = `The approval request "${old.title}" has been returned for revision. Reason: ${reason}`
      const link  = `/approvals/${requestId}`
      await adminDb.from('approval_notifications').insert(
        recs.map((r) => ({ request_id: requestId, company_id: companyId, recipient_id: r.id, type: 'returned', title, body, link, entity_type: 'approval_request', entity_id: requestId, is_read: false, sent_at: new Date().toISOString() }))
      )
      await Promise.allSettled(
        recs.filter((r) => r.email).map((r) => sendApprovalEmail(r.email!, title, body, `${appUrl}${link}`, r.full_name ?? undefined))
      )
    }
  } catch { /* non-critical */ }

  return data as ApprovalRequest
}

// ---------------------------------------------------------------------------
// cancelRequest
// ---------------------------------------------------------------------------
export async function cancelRequest(
  requestId: string,
  companyId: string,
  userId: string,
): Promise<ApprovalRequest> {
  const supabase = await db()
  const old = await getApprovalRequestById(requestId, companyId)
  if (!old) throw new Error('Request not found')

  const { data, error } = await supabase
    .from('approval_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) throw error

  await logAction(supabase, requestId, companyId, userId, 'cancelled', old.status, 'cancelled', null)

  return data as ApprovalRequest
}

// ---------------------------------------------------------------------------
// addComment
// ---------------------------------------------------------------------------
export async function addApprovalComment(
  requestId: string,
  companyId: string,
  userId: string,
  comment: string,
  isInternal = false,
): Promise<void> {
  const supabase = await db()
  await logAction(supabase, requestId, companyId, userId, 'commented', null, null, comment, undefined, isInternal)
}

// ---------------------------------------------------------------------------
// getApprovalStats
// ---------------------------------------------------------------------------
export async function getApprovalStats(companyId: string, userId: string): Promise<ApprovalStats> {
  const supabase = await db()
  const today = new Date().toISOString().slice(0, 10)

  const [total, pending, approvedToday, rejectedToday, myPending] = await Promise.all([
    supabase.from('approval_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('approval_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      .not('status', 'in', '("approved","rejected","cancelled","completed","draft")'),
    supabase.from('approval_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      .eq('status', 'approved').gte('updated_at', today),
    supabase.from('approval_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      .eq('status', 'rejected').gte('updated_at', today),
    supabase.from('approval_steps').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
      .eq('approver_id', userId).eq('status', 'pending'),
  ])

  const totalCount = total.count ?? 0
  const approvedCount = (await supabase.from('approval_requests').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'approved')).count ?? 0
  const completionRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0

  // Average approval time in hours
  const { data: completedReqs } = await supabase
    .from('approval_requests')
    .select('submitted_at, completed_at')
    .eq('company_id', companyId)
    .eq('status', 'approved')
    .not('submitted_at', 'is', null)
    .not('completed_at', 'is', null)
    .limit(100)

  let avgHours: number | null = null
  if (completedReqs && completedReqs.length > 0) {
    const totalMs = completedReqs.reduce((sum: number, r: { submitted_at: string; completed_at: string }) => {
      return sum + (new Date(r.completed_at).getTime() - new Date(r.submitted_at).getTime())
    }, 0)
    avgHours = Math.round(totalMs / completedReqs.length / 3600000)
  }

  return {
    total: totalCount,
    pending: pending.count ?? 0,
    approved_today: approvedToday.count ?? 0,
    rejected_today: rejectedToday.count ?? 0,
    awaiting_my_approval: myPending.count ?? 0,
    completion_rate: completionRate,
    avg_approval_hours: avgHours,
  }
}

// ---------------------------------------------------------------------------
// getWorkflows
// ---------------------------------------------------------------------------
export async function getWorkflows(companyId: string): Promise<ApprovalWorkflow[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('approval_workflows')
    .select(`*, steps:approval_workflow_steps ( *, approver:users!approval_workflow_steps_approver_id_fkey ( id, full_name, email ) )`)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ApprovalWorkflow[]
}

// ---------------------------------------------------------------------------
// getAuditLog — approval_actions for a company with actor info
// ---------------------------------------------------------------------------
export async function getAuditLog(
  companyId: string,
  filters: { search?: string; entity_type?: string; page?: number; pageSize?: number } = {},
) {
  const supabase = await db()
  const { page = 1, pageSize = 30, entity_type } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('approval_actions')
    .select(
      `id, action_type, comment, is_internal, old_status, new_status, performed_at, metadata,
       actor:users!approval_actions_actor_id_fkey ( id, full_name, email ),
       request:approval_requests ( id, title, entity_type, entity_ref, entity_id )`,
      { count: 'exact' },
    )
    .eq('company_id', companyId)
    .order('performed_at', { ascending: false })
    .range(from, to)

  if (entity_type) {
    query = query.eq('request.entity_type', entity_type)
  }

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

// ---------------------------------------------------------------------------
// getUserNotifications
// ---------------------------------------------------------------------------
export async function getUserNotifications(companyId: string, userId: string, limit = 20) {
  const supabase = await db()
  const { data, error } = await supabase
    .from('approval_notifications')
    .select('*')
    .eq('company_id', companyId)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// ---------------------------------------------------------------------------
// markNotificationsRead
// ---------------------------------------------------------------------------
export async function markNotificationsRead(companyId: string, userId: string) {
  const supabase = await db()
  await supabase
    .from('approval_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .eq('recipient_id', userId)
    .eq('is_read', false)
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function roleToStatus(role: string): ApprovalRequestStatus {
  const map: Record<string, ApprovalRequestStatus> = {
    manager: 'pending_manager',
    procurement_officer: 'pending_procurement',
    finance: 'pending_finance',
    administrator: 'pending_final',
  }
  return map[role] ?? 'pending_manager'
}

async function logAction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  requestId: string,
  companyId: string,
  actorId: string,
  actionType: string,
  oldStatus: ApprovalRequestStatus | null,
  newStatus: ApprovalRequestStatus | null,
  comment: string | null,
  stepId?: string,
  isInternal = false,
) {
  await supabase.from('approval_actions').insert({
    request_id: requestId,
    step_id: stepId ?? null,
    company_id: companyId,
    action_type: actionType,
    actor_id: actorId,
    comment: comment ?? null,
    is_internal: isInternal,
    old_status: oldStatus,
    new_status: newStatus,
  })
}

async function createNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  requestId: string,
  companyId: string,
  recipientId: string | null,
  type: string,
  title: string,
  body: string,
  link?: string,
) {
  if (!recipientId) return
  await supabase.from('approval_notifications').insert({
    request_id: requestId,
    company_id: companyId,
    recipient_id: recipientId,
    type,
    title,
    body,
    link: link ?? `/approvals/${requestId}`,
    entity_type: 'approval_request',
    entity_id: requestId,
  })
}

// ---------------------------------------------------------------------------
// getWorkflowById
// ---------------------------------------------------------------------------
export async function getWorkflowById(
  id: string,
  companyId: string,
): Promise<ApprovalWorkflow | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('approval_workflows')
    .select(
      `*, steps:approval_workflow_steps (
        *,
        approver:users!approval_workflow_steps_approver_id_fkey ( id, full_name, email, role )
      )`,
    )
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  if (data?.steps) {
    data.steps.sort(
      (a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order,
    )
  }

  return data as ApprovalWorkflow
}

// ---------------------------------------------------------------------------
// createWorkflow
// ---------------------------------------------------------------------------
export interface WorkflowStepInput {
  step_order: number
  name: string
  role_required: string
  approver_id?: string | null
  is_optional?: boolean
  timeout_hours?: number | null
}

export interface WorkflowInput {
  name: string
  description?: string | null
  entity_type: ApprovalEntityType
  is_default?: boolean
  steps: WorkflowStepInput[]
}

export async function createWorkflow(
  companyId: string,
  userId: string,
  input: WorkflowInput,
): Promise<ApprovalWorkflow> {
  const supabase = await db()

  // If marking as default, unset existing defaults for this entity type
  if (input.is_default) {
    await supabase
      .from('approval_workflows')
      .update({ is_default: false })
      .eq('company_id', companyId)
      .eq('entity_type', input.entity_type)
      .eq('is_default', true)
  }

  const { data: workflow, error } = await supabase
    .from('approval_workflows')
    .insert({
      company_id: companyId,
      name: input.name,
      description: input.description ?? null,
      entity_type: input.entity_type,
      is_active: true,
      is_default: input.is_default ?? false,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  if (input.steps.length > 0) {
    const stepRows = input.steps.map((s) => ({
      workflow_id: workflow.id,
      company_id: companyId,
      step_order: s.step_order,
      name: s.name,
      role_required: s.role_required,
      approver_id: s.approver_id ?? null,
      is_optional: s.is_optional ?? false,
      timeout_hours: s.timeout_hours ?? null,
    }))
    const { error: stepsErr } = await supabase
      .from('approval_workflow_steps')
      .insert(stepRows)
    if (stepsErr) throw stepsErr
  }

  const created = await getWorkflowById(workflow.id, companyId)
  return created as ApprovalWorkflow
}

// ---------------------------------------------------------------------------
// updateWorkflow
// ---------------------------------------------------------------------------
export async function updateWorkflow(
  id: string,
  companyId: string,
  userId: string,
  input: Partial<WorkflowInput> & { is_active?: boolean },
): Promise<ApprovalWorkflow> {
  const supabase = await db()

  // If marking as default, unset existing defaults
  if (input.is_default && input.entity_type) {
    await supabase
      .from('approval_workflows')
      .update({ is_default: false })
      .eq('company_id', companyId)
      .eq('entity_type', input.entity_type)
      .eq('is_default', true)
      .neq('id', id)
  }

  const { entity_type: _et, steps, ...fields } = input
  const { error } = await supabase
    .from('approval_workflows')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) throw error

  // Replace steps if provided
  if (steps !== undefined) {
    await supabase.from('approval_workflow_steps').delete().eq('workflow_id', id)

    if (steps.length > 0) {
      const stepRows = steps.map((s) => ({
        workflow_id: id,
        company_id: companyId,
        step_order: s.step_order,
        name: s.name,
        role_required: s.role_required,
        approver_id: s.approver_id ?? null,
        is_optional: s.is_optional ?? false,
        timeout_hours: s.timeout_hours ?? null,
      }))
      const { error: stepsErr } = await supabase
        .from('approval_workflow_steps')
        .insert(stepRows)
      if (stepsErr) throw stepsErr
    }
  }

  const updated = await getWorkflowById(id, companyId)
  return updated as ApprovalWorkflow
}

// ---------------------------------------------------------------------------
// deleteWorkflow
// ---------------------------------------------------------------------------
export async function deleteWorkflow(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('approval_workflows')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// setWorkflowActive
// ---------------------------------------------------------------------------
export async function setWorkflowActive(
  id: string,
  companyId: string,
  isActive: boolean,
): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('approval_workflows')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// getCompanyUsers — for the approver dropdown
// ---------------------------------------------------------------------------
export async function getCompanyUsers(
  companyId: string,
): Promise<Array<{ id: string; full_name: string | null; email: string | null; role: string }>> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('company_id', companyId)
    .order('full_name')
  if (error) throw error
  return data ?? []
}

// ---------------------------------------------------------------------------
// getEntityRecords — load selectable records for the approval request form
// ---------------------------------------------------------------------------

export interface EntityRecord {
  id: string
  label: string     // display text in the selector
  ref: string       // short reference (rfq_number, po_number, vendor name, …)
  amount?: number | null
}

/**
 * Returns a flat list of records for the given entity type, scoped to the
 * company. Used to populate the Record selector in the new approval request
 * form. Only returns a lightweight projection to keep the query fast.
 */
export async function getEntityRecords(
  companyId: string,
  entityType: ApprovalEntityType,
): Promise<EntityRecord[]> {
  const supabase = await db()

  switch (entityType) {
    case 'vendor': {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, category')
        .eq('company_id', companyId)
        .order('name')
        .limit(200)
      if (error) throw error
      return (data ?? []).map((r: { id: string; name: string; category: string }) => ({
        id: r.id,
        label: r.name,
        ref: r.name,
        amount: null,
      }))
    }

    case 'rfq': {
      const { data, error } = await supabase
        .from('rfqs')
        .select('id, rfq_number, title')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []).map((r: { id: string; rfq_number: string; title: string }) => ({
        id: r.id,
        label: `${r.rfq_number} — ${r.title}`,
        ref: r.rfq_number,
        amount: null,
      }))
    }

    case 'quotation': {
      const { data, error } = await supabase
        .from('quotations')
        .select('id, quotation_number, grand_total, vendor:vendors(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []).map(
        (r: { id: string; quotation_number: string; grand_total: number; vendor?: { name: string } | null }) => ({
          id: r.id,
          label: `${r.quotation_number}${r.vendor?.name ? ` — ${r.vendor.name}` : ''}`,
          ref: r.quotation_number,
          amount: r.grand_total ?? null,
        }),
      )
    }

    case 'purchase_order': {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, po_number, total_amount, vendor:vendors(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []).map(
        (r: { id: string; po_number: string; total_amount: number | null; vendor?: { name: string } | null }) => ({
          id: r.id,
          label: `${r.po_number}${r.vendor?.name ? ` — ${r.vendor.name}` : ''}`,
          ref: r.po_number,
          amount: r.total_amount ?? null,
        }),
      )
    }

    default:
      return []
  }
}
