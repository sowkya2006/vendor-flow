import { z } from 'zod'

const QUOTATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'shortlisted',
  'approved',
  'rejected',
  'expired',
] as const

const DISCOUNT_TYPES = ['percentage', 'fixed'] as const

const UNITS = [
  'unit', 'pcs', 'kg', 'g', 'lb', 'oz',
  'ltr', 'ml', 'box', 'set', 'pair', 'roll', 'sheet', 'hour', 'day', 'month',
]

export const quotationItemSchema = z.object({
  id: z.string().optional(),
  rfq_item_id: z.string().nullable().optional(),
  item_name: z
    .string()
    .min(1, 'Item name is required')
    .max(300, 'Item name must be 300 characters or fewer'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or fewer')
    .nullable()
    .optional()
    .or(z.literal('')),
  part_number: z
    .string()
    .max(100, 'Part number must be 100 characters or fewer')
    .nullable()
    .optional()
    .or(z.literal('')),
  unit: z.string().min(1, 'Unit is required').max(50),
  quantity: z
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Quantity must be greater than 0'),
  unit_price: z
    .number({ invalid_type_error: 'Must be a number' })
    .nonnegative('Price must be zero or greater'),
  discount_pct: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0)
    .max(100, 'Discount must be between 0 and 100')
    .optional()
    .default(0),
  tax_pct: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0)
    .max(100, 'Tax must be between 0 and 100')
    .optional()
    .default(0),
  delivery_days: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .positive()
    .nullable()
    .optional(),
  warranty_months: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .nonnegative()
    .nullable()
    .optional(),
  remarks: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .or(z.literal('')),
  sort_order: z.number().int().optional().default(0),
})

export const quotationSchema = z.object({
  rfq_id: z.string().min(1, 'RFQ is required'),
  vendor_id: z.string().min(1, 'Vendor is required'),
  discount_type: z.enum(DISCOUNT_TYPES).optional().default('percentage'),
  discount_value: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0)
    .optional()
    .default(0),
  delivery_days: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .positive()
    .nullable()
    .optional(),
  lead_time_days: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .positive()
    .nullable()
    .optional(),
  warranty_months: z
    .number({ invalid_type_error: 'Must be a number' })
    .int()
    .nonnegative()
    .nullable()
    .optional(),
  payment_terms: z
    .string()
    .max(1000)
    .nullable()
    .optional()
    .or(z.literal('')),
  validity_date: z.string().nullable().optional().or(z.literal('')),
  notes: z
    .string()
    .max(5000)
    .nullable()
    .optional()
    .or(z.literal('')),
  items: z.array(quotationItemSchema).optional().default([]),
})

export const quotationStatusSchema = z.object({
  status: z.enum(QUOTATION_STATUSES, {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
})

export const rejectQuotationSchema = z.object({
  rejection_reason: z
    .string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Reason must be 1000 characters or fewer'),
})

export type QuotationFormValues = z.infer<typeof quotationSchema>
export type QuotationItemFormValues = z.infer<typeof quotationItemSchema>
export type QuotationStatusValues = z.infer<typeof quotationStatusSchema>
export type RejectQuotationValues = z.infer<typeof rejectQuotationSchema>
