import { z } from 'zod'

const VENDOR_CATEGORIES = [
  'software',
  'hardware',
  'services',
  'consulting',
  'logistics',
  'marketing',
  'finance',
  'legal',
  'other',
] as const

const VENDOR_STATUSES = ['active', 'inactive', 'pending', 'suspended'] as const

export const vendorSchema = z.object({
  name: z
    .string()
    .min(1, 'Vendor name is required')
    .max(200, 'Name must be 200 characters or fewer'),

  category: z.enum(VENDOR_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a category' }),
  }),

  status: z.enum(VENDOR_STATUSES, {
    errorMap: () => ({ message: 'Please select a status' }),
  }),

  website: z
    .string()
    .url('Must be a valid URL (e.g. https://example.com)')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Must be a valid email address')
    .optional()
    .or(z.literal('')),

  phone: z.string().max(50, 'Phone must be 50 characters or fewer').optional().or(z.literal('')),

  address: z
    .string()
    .max(500, 'Address must be 500 characters or fewer')
    .optional()
    .or(z.literal('')),

  notes: z
    .string()
    .max(5000, 'Notes must be 5000 characters or fewer')
    .optional()
    .or(z.literal('')),

  contract_start_date: z.string().optional().or(z.literal('')),

  contract_end_date: z.string().optional().or(z.literal('')),

  contract_value: z
    .number({ invalid_type_error: 'Must be a number' })
    .nonnegative('Annual value must be zero or greater')
    .nullable()
    .optional(),
})

export type VendorFormValues = z.infer<typeof vendorSchema>
