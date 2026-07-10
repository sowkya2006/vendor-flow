'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  requireVendorUser,
  updateVendorProfile,
  updateVendorUserProfile,
  createVendorQuotation,
  updateVendorQuotation,
  withdrawVendorQuotation,
  submitVendorQuotation,
  createVendorInvoice,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/supabase/vendor-portal'
import {
  vendorProfileSchema,
  vendorUserProfileSchema,
  createVendorQuotationSchema,
  updateVendorQuotationSchema,
  createVendorInvoiceSchema,
} from '@/lib/validations/vendor-portal'
import type {
  VendorProfileInput,
  VendorUserProfileInput,
  CreateVendorQuotationInput,
  UpdateVendorQuotationInput,
  CreateVendorInvoiceInput,
} from '@/lib/validations/vendor-portal'

// ── Auth ──────────────────────────────────────────────────────
export async function vendorSignOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/vendor/login')
}

// ── Profile ───────────────────────────────────────────────────
export async function updateVendorProfileAction(values: VendorProfileInput) {
  const parsed = vendorProfileSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid data: ' + JSON.stringify(parsed.error.flatten()))
  const vu = await requireVendorUser()
  await updateVendorProfile(vu.vendor_id, parsed.data)
  revalidatePath('/vendor/profile')
}

export async function updateVendorUserProfileAction(values: VendorUserProfileInput) {
  const parsed = vendorUserProfileSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid data: ' + JSON.stringify(parsed.error.flatten()))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  await updateVendorUserProfile(user.id, parsed.data)
  revalidatePath('/vendor/profile')
}

// ── Quotations ────────────────────────────────────────────────
export async function createVendorQuotationAction(values: CreateVendorQuotationInput) {
  const parsed = createVendorQuotationSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid data: ' + JSON.stringify(parsed.error.flatten()))
  const vu = await requireVendorUser()
  const quotation = await createVendorQuotation(vu.vendor_id, vu.company_id, parsed.data)
  redirect(`/vendor/quotations/${quotation.id}`)
}

export async function updateVendorQuotationAction(id: string, values: UpdateVendorQuotationInput) {
  const parsed = updateVendorQuotationSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid data: ' + JSON.stringify(parsed.error.flatten()))
  const vu = await requireVendorUser()
  await updateVendorQuotation(id, vu.vendor_id, parsed.data)
  redirect(`/vendor/quotations/${id}`)
}

export async function withdrawVendorQuotationAction(id: string) {
  const vu = await requireVendorUser()
  await withdrawVendorQuotation(id, vu.vendor_id)
  revalidatePath(`/vendor/quotations/${id}`)
  revalidatePath('/vendor/quotations')
}

export async function submitVendorQuotationAction(id: string) {
  const vu = await requireVendorUser()
  await submitVendorQuotation(id, vu.vendor_id)
  revalidatePath(`/vendor/quotations/${id}`)
  revalidatePath('/vendor/quotations')
}

// ── Invoices ──────────────────────────────────────────────────
export async function createVendorInvoiceAction(values: CreateVendorInvoiceInput) {
  const parsed = createVendorInvoiceSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid data: ' + JSON.stringify(parsed.error.flatten()))
  const vu = await requireVendorUser()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const invoice = await createVendorInvoice(vu.vendor_id, vu.company_id, user.id, parsed.data)
  redirect(`/vendor/invoices/${invoice.id}`)
}

// ── Notifications ─────────────────────────────────────────────
export async function markNotificationReadAction(id: string) {
  const vu = await requireVendorUser()
  await markNotificationRead(id, vu.vendor_id)
  revalidatePath('/vendor/notifications')
}

export async function markAllNotificationsReadAction() {
  const vu = await requireVendorUser()
  await markAllNotificationsRead(vu.vendor_id)
  revalidatePath('/vendor/notifications')
  revalidatePath('/vendor/dashboard')
}
