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
import {
  registerVendorCompany,
  updateVendorCompany,
  sendCollaborationRequest,
  withdrawCollaborationRequest,
  getVendorCompanyByUserId,
} from '@/lib/supabase/vendor-registration'
import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────
export async function vendorSignOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/vendor/login')
}

// ── Vendor self-registration ──────────────────────────────────
const registerSchema = z.object({
  company_name: z.string().min(1).max(200),
  contact_name: z.string().max(200).optional().nullable(),
  email: z.string().email(),
  phone: z.string().max(30).optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  gst_number: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
})

export async function registerVendorAction(input: unknown) {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid data: ' + JSON.stringify(parsed.error.flatten()))
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  await registerVendorCompany(user.id, parsed.data, { useServiceRole: true })
}

const registerBeforeSchema = registerSchema.extend({ userId: z.string().uuid() })

export async function registerVendorBeforeVerificationAction(input: unknown) {
  const parsed = registerBeforeSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid data: ' + JSON.stringify(parsed.error.flatten()))
  const { userId, ...profileData } = parsed.data

  try {
    await registerVendorCompany(userId, profileData, { useServiceRole: true })
  } catch (err) {
    // Always extract a string message
    let msg = 'Unknown error'
    if (err instanceof Error) {
      msg = err.message
    } else if (typeof err === 'object' && err !== null) {
      const e = err as Record<string, unknown>
      msg = (e.message as string) ?? (e.details as string) ?? (e.hint as string) ?? JSON.stringify(err)
    } else {
      msg = String(err)
    }

    console.error('[registerVendorBeforeVerificationAction] error:', msg, err)

    if (msg.includes('23503') || msg.includes('foreign key') || msg.includes('violates foreign key')) {
      // FK violation — auth user not yet persisted. Retry once after a delay.
      console.log('[registerVendorBeforeVerificationAction] FK violation, retrying in 2s...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      try {
        await registerVendorCompany(userId, profileData, { useServiceRole: true })
        return // Retry succeeded
      } catch (retryErr) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : JSON.stringify(retryErr)
        throw new Error('Account creation failed — please try again in a moment. (' + retryMsg + ')')
      }
    }
    if (msg.includes('23505') || msg.includes('unique') || msg.includes('already exists')) {
      return // Already saved — safe to continue
    }
    throw new Error('Failed to save vendor profile: ' + msg)
  }
}

export async function updateVendorCompanyAction(input: unknown) {
  const parsed = registerSchema.partial().safeParse(input)
  if (!parsed.success) throw new Error('Invalid data')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  await updateVendorCompany(user.id, parsed.data)
  revalidatePath('/vendor/profile')
}

// ── Collaboration requests ────────────────────────────────────
export async function sendCollaborationRequestAction(companyId: string, message?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const vendorCompany = await getVendorCompanyByUserId(user.id, { useServiceRole: true })
  if (!vendorCompany) throw new Error('You must complete your vendor profile first')
  await sendCollaborationRequest(user.id, vendorCompany.id, companyId, message)
  try {
    const { notifyRoles } = await import('@/lib/notifications/engine')
    await notifyRoles(companyId, ['administrator', 'procurement_manager'], {
      type: 'vendor_request',
      title: 'New Vendor Collaboration Request',
      body: `${vendorCompany.company_name} wants to collaborate with your company.`,
      link: '/vendors/requests',
      entityType: 'vendor_request',
      entityId: vendorCompany.id,
    })
  } catch { /* non-critical */ }
  revalidatePath('/vendor/companies')
  revalidatePath('/vendor/requests')
}

export async function withdrawCollaborationRequestAction(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  await withdrawCollaborationRequest(user.id, requestId)
  revalidatePath('/vendor/requests')
}

// ── Profile ───────────────────────────────────────────────────
export async function updateVendorProfileAction(values: VendorProfileInput) {
  const parsed = vendorProfileSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid data')
  const vu = await requireVendorUser()
  await updateVendorProfile(vu.vendor_id, parsed.data)
  revalidatePath('/vendor/profile')
}

export async function updateVendorUserProfileAction(values: VendorUserProfileInput) {
  const parsed = vendorUserProfileSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid data')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  await updateVendorUserProfile(user.id, parsed.data)
  revalidatePath('/vendor/profile')
}

// ── Quotations ────────────────────────────────────────────────
export async function createVendorQuotationAction(values: CreateVendorQuotationInput) {
  const parsed = createVendorQuotationSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid data')
  const vu = await requireVendorUser()
  const quotation = await createVendorQuotation(vu.vendor_id, vu.company_id, parsed.data)
  try {
    const { notify } = await import('@/lib/notifications/engine')
    await notify({
      event: 'QUOTATION_SUBMITTED',
      companyId: vu.company_id,
      triggeredBy: vu.user_id ?? vu.vendor_id,
      triggeredByName: 'A vendor',
      entityId: quotation.id,
      entityRef: (quotation as { quotation_number?: string }).quotation_number ?? quotation.id,
      entityType: 'quotation',
      meta: { rfqRef: parsed.data.rfq_id ?? '' },
    })
  } catch { /* non-critical */ }
  redirect(`/vendor/quotations/${quotation.id}`)
}

export async function updateVendorQuotationAction(id: string, values: UpdateVendorQuotationInput) {
  const parsed = updateVendorQuotationSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid data')
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

// ── Purchase Order vendor actions ─────────────────────────────
// All three actions use the admin client because the vendor's anon-key
// session does NOT have UPDATE permission on purchase_orders via RLS
// (vendor_id references vendors.id, not auth.uid()).

async function adminPOUpdate(
  poId: string,
  data: Record<string, unknown>,
  fallbackData?: Record<string, unknown>,
): Promise<void> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any
  let { error } = await db.from('purchase_orders').update(data).eq('id', poId)

  // If a column doesn't exist yet, retry with fallback data
  if (error && fallbackData) {
    const errMsg = error.message ?? ''
    const hasBadCol = Object.keys(data).some((k) => errMsg.includes(k))
    if (hasBadCol) {
      ;({ error } = await db.from('purchase_orders').update(fallbackData).eq('id', poId))
    }
  }

  if (error) throw new Error(error.message)
}

export async function vendorAcceptPOAction(poId: string) {
  await adminPOUpdate(
    poId,
    { vendor_acceptance: 'accepted', vendor_accepted_at: new Date().toISOString(), status: 'acknowledged', updated_at: new Date().toISOString() },
    { vendor_acceptance: 'accepted', status: 'acknowledged', updated_at: new Date().toISOString() },
  )

  try {
    const vu = await requireVendorUser()
    if (vu.company_id) {
      const { notifyRoles } = await import('@/lib/notifications/engine')
      await notifyRoles(vu.company_id, ['procurement_officer', 'procurement_manager', 'administrator'], {
        type: 'po_issued',
        title: 'Vendor Accepted Purchase Order',
        body: 'The vendor accepted the Purchase Order. Delivery is in progress.',
        link: `/purchase-orders/${poId}`,
        entityType: 'purchase_order',
        entityId: poId,
      })
    }
  } catch { /* non-critical */ }

  revalidatePath(`/vendor/purchase-orders/${poId}`)
  revalidatePath('/vendor/purchase-orders')
  revalidatePath('/vendor/invoices/new')
}

export async function vendorRejectPOAction(poId: string, reason: string) {
  await adminPOUpdate(
    poId,
    { vendor_acceptance: 'rejected', vendor_rejection_reason: reason, updated_at: new Date().toISOString() },
    { vendor_acceptance: 'rejected', updated_at: new Date().toISOString() },
  )

  try {
    const vu = await requireVendorUser()
    if (vu.company_id) {
      const { notifyRoles } = await import('@/lib/notifications/engine')
      await notifyRoles(vu.company_id, ['procurement_officer', 'procurement_manager', 'administrator'], {
        type: 'rejected',
        title: 'Vendor Rejected Purchase Order',
        body: `The vendor rejected the PO. Reason: ${reason}`,
        link: `/purchase-orders/${poId}`,
        entityType: 'purchase_order',
        entityId: poId,
      })
    }
  } catch { /* non-critical */ }

  revalidatePath(`/vendor/purchase-orders/${poId}`)
  revalidatePath('/vendor/purchase-orders')
}

export async function vendorRequestClarificationAction(poId: string, message: string) {
  await adminPOUpdate(
    poId,
    { vendor_acceptance: 'clarification_requested', vendor_rejection_reason: message, updated_at: new Date().toISOString() },
    { vendor_acceptance: 'clarification_requested', updated_at: new Date().toISOString() },
  )

  try {
    const vu = await requireVendorUser()
    if (vu.company_id) {
      const { notifyRoles } = await import('@/lib/notifications/engine')
      await notifyRoles(vu.company_id, ['procurement_officer', 'procurement_manager'], {
        type: 'general',
        title: 'Vendor Requested Clarification on PO',
        body: message,
        link: `/purchase-orders/${poId}`,
        entityType: 'purchase_order',
        entityId: poId,
      })
    }
  } catch { /* non-critical */ }

  revalidatePath(`/vendor/purchase-orders/${poId}`)
  revalidatePath('/vendor/purchase-orders')
}

// ── Invoices ──────────────────────────────────────────────────
export async function createVendorInvoiceAction(values: CreateVendorInvoiceInput) {
  const parsed = createVendorInvoiceSchema.safeParse(values)
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    throw new Error(firstError ?? 'Invalid invoice data. Please check all required fields.')
  }

  const vu = await requireVendorUser()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Resolve company_id from the PO if not on the vendor user
  let companyId = vu.company_id
  if (!companyId && parsed.data.purchase_order_id) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adminDb = createAdminClient() as any
      const { data: po } = await adminDb
        .from('purchase_orders')
        .select('company_id')
        .eq('id', parsed.data.purchase_order_id)
        .maybeSingle()
      if (po?.company_id) companyId = po.company_id
    } catch { /* non-critical */ }
  }

  // Resolve the real vendors.id for this vendor user
  // For self-registered vendors, vu.vendor_id may be vendor_companies.id
  // invoices.vendor_id must reference vendors(id)
  let realVendorId = vu.vendor_id
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminDb = createAdminClient() as any

    // Check if vu.vendor_id is a valid vendors.id
    const { data: vendorRow } = await adminDb
      .from('vendors')
      .select('id')
      .eq('id', vu.vendor_id)
      .maybeSingle()

    if (!vendorRow) {
      // Not a vendors.id — look up via vendor_company_id FK
      const { data: linkedVendor } = await adminDb
        .from('vendors')
        .select('id')
        .eq('vendor_company_id', vu.vendor_id)
        .maybeSingle()

      if (linkedVendor) {
        realVendorId = linkedVendor.id
      } else if (vu.email) {
        // Final fallback: match by email
        const { data: vendorByEmail } = await adminDb
          .from('vendors')
          .select('id')
          .eq('email', vu.email)
          .maybeSingle()
        if (vendorByEmail) realVendorId = vendorByEmail.id
      }
    }
  } catch { /* use vu.vendor_id as fallback */ }

  const invoice = await createVendorInvoice(realVendorId, companyId, user.id, parsed.data)

  try {
    const { notifyRoles, notifyVendor } = await import('@/lib/notifications/engine')
    if (companyId) {
      await notifyRoles(companyId, ['finance_manager', 'administrator'], {
        type: 'invoice_submitted',
        title: 'New Invoice Submitted',
        body: `Vendor has submitted invoice ${parsed.data.invoice_number} for review.`,
        link: `/payments/invoices/${invoice.id}`,
        entityType: 'invoice',
        entityId: invoice.id,
      })
    }
    // Confirm to vendor that their invoice was submitted
    await notifyVendor(realVendorId, {
      type: 'invoice_submitted',
      title: `Invoice Submitted: ${parsed.data.invoice_number}`,
      body: `Your invoice ${parsed.data.invoice_number} has been submitted successfully and is awaiting Finance review.`,
      link: `/vendor/invoices/${invoice.id}`,
      entityType: 'invoice',
      entityId: invoice.id,
      companyId: companyId || undefined,
    })
  } catch { /* non-critical */ }

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
