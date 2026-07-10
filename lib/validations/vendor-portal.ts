import { z } from 'zod'

// ── Profile update ────────────────────────────────────────────
export const vendorProfileSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  legal_name: z.string().max(200).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  tax_id: z.string().max(100).optional().nullable(),
  registration_number: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
})
export type VendorProfileInput = z.infer<typeof vendorProfileSchema>

// ── Vendor user self-update ───────────────────────────────────
export const vendorUserProfileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().max(50).optional().nullable(),
})
export type VendorUserProfileInput = z.infer<typeof vendorUserProfileSchema>

// ── Quotation item ────────────────────────────────────────────
export const vendorQuotationItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.coerce.number().positive('Must be > 0'),
  unit: z.string().max(50).optional().nullable(),
  unit_price: z.coerce.number().nonnegative('Must be ≥ 0'),
  tax_percentage: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().max(500).optional().nullable(),
})

// ── Create quotation ──────────────────────────────────────────
export const createVendorQuotationSchema = z.object({
  rfq_id: z.string().uuid().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  currency: z.string().length(3).default('INR'),
  discount_amount: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(vendorQuotationItemSchema).min(1, 'At least one item is required'),
})
export type CreateVendorQuotationInput = z.infer<typeof createVendorQuotationSchema>

// ── Update quotation (partial) ────────────────────────────────
export const updateVendorQuotationSchema = createVendorQuotationSchema.partial().extend({
  items: z.array(vendorQuotationItemSchema).min(1).optional(),
})
export type UpdateVendorQuotationInput = z.infer<typeof updateVendorQuotationSchema>

// ── Create invoice (vendor-side) ──────────────────────────────
export const vendorInvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.coerce.number().positive('Must be > 0'),
  unit_price: z.coerce.number().nonnegative('Must be ≥ 0'),
  tax_percentage: z.coerce.number().min(0).max(100).default(0),
})

export const createVendorInvoiceSchema = z.object({
  purchase_order_id: z.string().uuid().optional().nullable(),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().optional().nullable(),
  currency: z.string().length(3).default('INR'),
  discount_amount: z.coerce.number().min(0).default(0),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(vendorInvoiceItemSchema).min(1, 'At least one item is required'),
})
export type CreateVendorInvoiceInput = z.infer<typeof createVendorInvoiceSchema>
