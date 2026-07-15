import { z } from 'zod'

const PR_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const PR_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled', 'converted'] as const

export const prItemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.coerce.number({ invalid_type_error: 'Must be a number' }).positive('Must be > 0'),
  unit: z.string().min(1, 'Unit is required').max(50),
  estimated_unit_price: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().max(500).optional().nullable(),
})

export const purchaseRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(5000).nullable().optional().or(z.literal('')),
  department: z.string().max(100).nullable().optional().or(z.literal('')),
  priority: z.enum(PR_PRIORITIES, { errorMap: () => ({ message: 'Select a priority' }) }),
  required_date: z.string().nullable().optional().or(z.literal('')),
  budget_amount: z.coerce.number().nonnegative('Must be ≥ 0').nullable().optional(),
  currency: z.string().length(3).default('INR'),
  notes: z.string().max(5000).nullable().optional().or(z.literal('')),
  items: z.array(prItemSchema).optional().default([]),
})

export const prStatusSchema = z.object({
  status: z.enum(PR_STATUSES, { errorMap: () => ({ message: 'Invalid status' }) }),
  rejection_reason: z.string().max(1000).optional().nullable(),
})

export type PRFormValues = z.infer<typeof purchaseRequestSchema>
export type PRItemValues = z.infer<typeof prItemSchema>
export type PRStatusValues = z.infer<typeof prStatusSchema>
