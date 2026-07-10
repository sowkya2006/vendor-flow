import { z } from 'zod'

const PO_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'acknowledged',
  'in_progress',
  'completed',
  'cancelled',
] as const

export const poItemSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or fewer'),
  quantity: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Quantity must be greater than 0'),
  unit: z
    .string()
    .min(1, 'Unit is required')
    .max(50, 'Unit must be 50 characters or fewer'),
  unit_price: z
    .number({ invalid_type_error: 'Must be a number' })
    .nonnegative('Unit price must be zero or greater'),
})

export const purchaseOrderSchema = z.object({
  vendor_id: z.string().min(1, 'Vendor is required'),
  rfq_id: z.string().nullable().optional().or(z.literal('')),
  due_date: z.string().nullable().optional().or(z.literal('')),
  shipping_address: z
    .string()
    .max(500, 'Address must be 500 characters or fewer')
    .nullable()
    .optional()
    .or(z.literal('')),
  billing_address: z
    .string()
    .max(500, 'Address must be 500 characters or fewer')
    .nullable()
    .optional()
    .or(z.literal('')),
  payment_terms: z
    .string()
    .max(1000, 'Payment terms must be 1000 characters or fewer')
    .nullable()
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(5000, 'Notes must be 5000 characters or fewer')
    .nullable()
    .optional()
    .or(z.literal('')),
  items: z.array(poItemSchema).optional(),
})

export const poStatusSchema = z.object({
  status: z.enum(PO_STATUSES, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
})

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>
export type POStatusValues = z.infer<typeof poStatusSchema>
