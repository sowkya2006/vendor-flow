import { z } from 'zod'

// ── Invoice item ──────────────────────────────────────────────────────────────
export const invoiceItemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.coerce.number({ invalid_type_error: 'Must be a number' }).positive('Must be > 0'),
  unit_price: z.coerce.number({ invalid_type_error: 'Must be a number' }).nonnegative('Must be ≥ 0'),
  tax_percentage: z.coerce.number().min(0).max(100).default(0),
})

// ── Invoice ───────────────────────────────────────────────────────────────────
export const invoiceSchema = z.object({
  purchase_order_id: z.string().uuid().optional().nullable(),
  vendor_id: z.string().min(1, 'Vendor is required'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().optional().nullable(),
  discount_amount: z.coerce.number().min(0, 'Must be ≥ 0').default(0),
  currency: z.string().length(3, 'Must be 3-char currency code').default('INR'),
  notes: z.string().max(5000).optional().nullable(),
  items: z
    .array(invoiceItemSchema)
    .min(1, 'At least one line item is required'),
})

export const updateInvoiceSchema = invoiceSchema.partial().extend({
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required').optional(),
})

export const invoiceStatusSchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'cancelled']),
})

// ── Payment ───────────────────────────────────────────────────────────────────
export const paymentSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_method: z.enum(['bank_transfer', 'upi', 'cheque', 'cash', 'card'], {
    required_error: 'Payment method is required',
  }),
  amount: z.coerce
    .number({ invalid_type_error: 'Must be a number' })
    .positive('Amount must be greater than 0'),
  notes: z.string().max(2000).optional().nullable(),
})

// ── Exported types ────────────────────────────────────────────────────────────
export type InvoiceFormValues = z.infer<typeof invoiceSchema>
export type UpdateInvoiceFormValues = z.infer<typeof updateInvoiceSchema>
export type InvoiceItemValues = z.infer<typeof invoiceItemSchema>
export type PaymentFormValues = z.infer<typeof paymentSchema>
export type InvoiceStatusValues = z.infer<typeof invoiceStatusSchema>
