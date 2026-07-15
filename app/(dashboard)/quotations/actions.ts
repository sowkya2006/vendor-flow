'use server'

import { redirect } from 'next/navigation'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  updateQuotation, deleteQuotation, approveQuotation, rejectQuotation,
  shortlistQuotation, reopenQuotation, markUnderReview, addQuotationComment,
  submitQuotation,
} from '@/lib/supabase/quotations'
import { quotationSchema, rejectQuotationSchema } from '@/lib/validations/quotation'
import type { QuotationFormValues } from '@/lib/validations/quotation'
import { guardPermission } from '@/lib/supabase/permission-guard'
import { notify } from '@/lib/notifications/engine'

// Quotation creation is VENDOR PORTAL ONLY
export async function createQuotationAction(_values: QuotationFormValues): Promise<never> {
  throw new Error('FORBIDDEN: Quotations can only be created in the Vendor Portal')
}

export async function updateQuotationAction(id: string, values: QuotationFormValues) {
  await guardPermission('approve_quotations')
  const parsed = quotationSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid form data')
  const user = await getUser()
  const companyId = await getCompanyId()
  await updateQuotation(id, companyId, parsed.data, user.id)
  redirect(`/quotations/${id}`)
}

export async function deleteQuotationAction(id: string) {
  await guardPermission('approve_quotations')
  const companyId = await getCompanyId()
  await deleteQuotation(id, companyId)
  redirect('/quotations')
}

export async function approveQuotationAction(id: string) {
  await guardPermission('approve_quotations')
  const user = await getUser()
  const companyId = await getCompanyId()
  await approveQuotation(id, companyId, user.id)
  await notify({ event: 'QUOTATION_APPROVED', companyId, triggeredBy: user.id, entityId: id, entityRef: id, entityType: 'quotation' })

  // Notify the vendor that their quotation was approved
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const { data: q } = await db
      .from('quotations').select('quotation_number, vendor_id').eq('id', id).maybeSingle()
    if (q?.vendor_id) {
      const { notifyVendor } = await import('@/lib/notifications/engine')
      await notifyVendor(q.vendor_id, {
        type: 'approved',
        title: `Quotation Approved: ${q.quotation_number}`,
        body: `Your quotation ${q.quotation_number} has been approved! The company will now create a Purchase Order.`,
        link: `/vendor/quotations/${id}`,
        entityType: 'quotation',
        entityId: id,
        companyId,
      })
    }
  } catch { /* non-critical */ }

  redirect(`/quotations/${id}`)
}

export async function rejectQuotationAction(id: string, reason: string) {
  await guardPermission('approve_quotations')
  const parsed = rejectQuotationSchema.safeParse({ rejection_reason: reason })
  if (!parsed.success) throw new Error('Rejection reason is required')
  const user = await getUser()
  const companyId = await getCompanyId()
  await rejectQuotation(id, companyId, user.id, parsed.data.rejection_reason)
  await notify({ event: 'QUOTATION_REJECTED', companyId, triggeredBy: user.id, entityId: id, entityRef: id, entityType: 'quotation' })

  // Notify the vendor that their quotation was rejected
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const { data: q } = await db
      .from('quotations').select('quotation_number, vendor_id').eq('id', id).maybeSingle()
    if (q?.vendor_id) {
      const { notifyVendor } = await import('@/lib/notifications/engine')
      await notifyVendor(q.vendor_id, {
        type: 'rejected',
        title: `Quotation Not Selected: ${q.quotation_number}`,
        body: `Your quotation ${q.quotation_number} was not selected. Reason: ${reason || 'Not specified'}.`,
        link: `/vendor/quotations/${id}`,
        entityType: 'quotation',
        entityId: id,
        companyId,
      })
    }
  } catch { /* non-critical */ }

  redirect(`/quotations/${id}`)
}

export async function shortlistQuotationAction(id: string) {
  await guardPermission('approve_quotations')
  const user = await getUser()
  const companyId = await getCompanyId()
  await shortlistQuotation(id, companyId, user.id)
  redirect(`/quotations/${id}`)
}

export async function reopenQuotationAction(id: string) {
  await guardPermission('approve_quotations')
  const user = await getUser()
  const companyId = await getCompanyId()
  await reopenQuotation(id, companyId, user.id)
  redirect(`/quotations/${id}`)
}

export async function markUnderReviewAction(id: string) {
  await guardPermission('approve_quotations')
  const user = await getUser()
  const companyId = await getCompanyId()
  await markUnderReview(id, companyId, user.id)
  redirect(`/quotations/${id}`)
}

export async function submitQuotationAction(id: string) {
  await guardPermission('approve_quotations')
  const user = await getUser()
  const companyId = await getCompanyId()
  await submitQuotation(id, companyId, user.id)
  redirect(`/quotations/${id}`)
}

export async function addCommentAction(quotationId: string, comment: string, isInternal: boolean) {
  if (!comment.trim()) throw new Error('Comment cannot be empty')
  const user = await getUser()
  const companyId = await getCompanyId()
  await addQuotationComment(quotationId, companyId, user.id, comment.trim(), isInternal)
}
