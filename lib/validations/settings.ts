import { z } from 'zod'

// ── Profile ───────────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be 100 characters or fewer'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email address'),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

// ── Password ──────────────────────────────────────────────────────────────────

export const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be 128 characters or fewer'),
    confirm_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type PasswordFormValues = z.infer<typeof passwordSchema>

// ── Notification preferences ──────────────────────────────────────────────────

export const notificationPrefsSchema = z.object({
  vendor_submitted: z.boolean(),
  vendor_approved: z.boolean(),
  vendor_rejected: z.boolean(),
  approval_requested: z.boolean(),
  approval_completed: z.boolean(),
  po_created: z.boolean(),
  po_approved: z.boolean(),
  rfq_received: z.boolean(),
  quotation_received: z.boolean(),
})

export type NotificationPrefsValues = z.infer<typeof notificationPrefsSchema>

// ── Organization ──────────────────────────────────────────────────────────────

export const organizationSchema = z.object({
  org_name: z
    .string()
    .min(1, 'Organization name is required')
    .max(200, 'Must be 200 characters or fewer'),
  timezone: z.string().min(1, 'Timezone is required'),
  currency: z.string().min(1, 'Currency is required'),
  fiscal_year_start: z.coerce
    .number()
    .int()
    .min(1)
    .max(12, 'Must be a month 1–12'),
})

export type OrganizationFormValues = z.infer<typeof organizationSchema>
