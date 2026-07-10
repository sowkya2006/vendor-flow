import { z } from 'zod'

const RFQ_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const RFQ_STATUSES = ['draft', 'sent', 'under_review', 'awarded', 'cancelled'] as const

export const rfqItemSchema = z.object({
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
  estimated_unit_price: z
    .number({ invalid_type_error: 'Must be a number' })
    .nonnegative('Price must be zero or greater')
    .nullable()
    .optional(),
})

export const rfqSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or fewer'),
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or fewer')
    .nullable()
    .optional()
    .or(z.literal('')),
  vendor_id: z.string().min(1, 'Vendor is required'),
  due_date: z.string().nullable().optional().or(z.literal('')),
  priority: z.enum(RFQ_PRIORITIES, {
    errorMap: () => ({ message: 'Please select a priority' }),
  }),
  terms: z
    .string()
    .max(5000, 'Terms must be 5000 characters or fewer')
    .nullable()
    .optional()
    .or(z.literal('')),
  items: z.array(rfqItemSchema).optional(),
})

export const rfqStatusSchema = z.object({
  status: z.enum(RFQ_STATUSES, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
})

export type RFQFormValues = z.infer<typeof rfqSchema>
export type RFQStatusValues = z.infer<typeof rfqStatusSchema>
