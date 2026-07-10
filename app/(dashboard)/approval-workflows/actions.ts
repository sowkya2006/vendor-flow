'use server'

import { redirect } from 'next/navigation'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  setWorkflowActive,
} from '@/lib/supabase/approvals'
import { createWorkflowSchema } from '@/lib/validations/approval'
import type { CreateWorkflowValues } from '@/lib/validations/approval'

// (getUser imported from get-auth above)

// ---------------------------------------------------------------------------
// createWorkflowAction
// ---------------------------------------------------------------------------
export async function createWorkflowAction(values: CreateWorkflowValues) {
  const parsed = createWorkflowSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid form data')

  const user = await getUser()
  const companyId = await getCompanyId()

  const workflow = await createWorkflow(companyId, user.id, {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    entity_type: parsed.data.entity_type,
    is_default: parsed.data.is_default,
    steps: parsed.data.steps.map((s, idx) => ({
      step_order: s.step_order ?? idx + 1,
      name: s.name,
      role_required: s.role_required,
      approver_id: s.approver_id ?? null,
      is_optional: s.is_optional ?? false,
      timeout_hours: s.timeout_hours ?? null,
    })),
  })

  redirect(`/approval-workflows/${workflow.id}`)
}

// ---------------------------------------------------------------------------
// updateWorkflowAction
// ---------------------------------------------------------------------------
export async function updateWorkflowAction(id: string, values: CreateWorkflowValues) {
  const parsed = createWorkflowSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid form data')

  const user = await getUser()
  const companyId = await getCompanyId()

  await updateWorkflow(id, companyId, user.id, {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    entity_type: parsed.data.entity_type,
    is_default: parsed.data.is_default,
    steps: parsed.data.steps.map((s, idx) => ({
      step_order: s.step_order ?? idx + 1,
      name: s.name,
      role_required: s.role_required,
      approver_id: s.approver_id ?? null,
      is_optional: s.is_optional ?? false,
      timeout_hours: s.timeout_hours ?? null,
    })),
  })

  redirect(`/approval-workflows/${id}`)
}

// ---------------------------------------------------------------------------
// deleteWorkflowAction
// ---------------------------------------------------------------------------
export async function deleteWorkflowAction(id: string) {
  const companyId = await getCompanyId()
  await deleteWorkflow(id, companyId)
  redirect('/approval-workflows')
}

// ---------------------------------------------------------------------------
// toggleWorkflowActiveAction
// ---------------------------------------------------------------------------
export async function toggleWorkflowActiveAction(id: string, isActive: boolean) {
  const companyId = await getCompanyId()
  await setWorkflowActive(id, companyId, isActive)
}
