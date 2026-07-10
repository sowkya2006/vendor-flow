import { z } from 'zod'

const ENTITY_TYPES = ['vendor', 'rfq', 'quotation', 'purchase_order', 'contract', 'invoice'] as const
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
const ROLES = ['employee', 'manager', 'procurement_officer', 'finance', 'administrator'] as const

export const createApprovalRequestSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES, { errorMap: () => ({ message: 'Entity type is required' }) }),
  entity_id: z.string().uuid('Invalid entity ID'),
  entity_ref: z.string().max(100).optional().or(z.literal('')),
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).nullable().optional().or(z.literal('')),
  amount: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).optional().default('INR'),
  priority: z.enum(PRIORITIES).optional().default('normal'),
  due_date: z.string().nullable().optional().or(z.literal('')),
  workflow_id: z.string().uuid().nullable().optional(),
})

export const approvalDecisionSchema = z.object({
  comment: z.string().max(2000).nullable().optional().or(z.literal('')),
  is_internal: z.boolean().optional().default(false),
})

export const rejectApprovalSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(2000),
  is_internal: z.boolean().optional().default(false),
})

export const returnApprovalSchema = z.object({
  reason: z.string().min(1, 'Return reason is required').max(2000),
})

export const workflowStepSchema = z.object({
  step_order: z.number().int().positive(),
  name: z.string().min(1, 'Step name is required').max(200),
  role_required: z.enum(ROLES),
  approver_id: z.string().uuid().nullable().optional(),
  is_optional: z.boolean().optional().default(false),
  timeout_hours: z.number().int().positive().nullable().optional(),
})

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(200),
  description: z.string().max(1000).nullable().optional().or(z.literal('')),
  entity_type: z.enum(ENTITY_TYPES),
  is_default: z.boolean().optional().default(false),
  steps: z.array(workflowStepSchema).min(1, 'At least one step is required'),
})

export type CreateApprovalRequestValues = z.infer<typeof createApprovalRequestSchema>
export type ApprovalDecisionValues = z.infer<typeof approvalDecisionSchema>
export type RejectApprovalValues = z.infer<typeof rejectApprovalSchema>
export type ReturnApprovalValues = z.infer<typeof returnApprovalSchema>
export type CreateWorkflowValues = z.infer<typeof createWorkflowSchema>
