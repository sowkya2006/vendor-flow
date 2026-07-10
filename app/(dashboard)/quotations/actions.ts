'use server'

import { redirect } from 'next/navigation'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  createQuotation,
  updateQuotation,
  deleteQuotation,
  submitQuotation,
  approveQuotation,
  rejectQuotation,
  shortlistQuotation,
  reopenQuotation,
  markUnderReview,
  addQuotationComment,
} from '@/lib/supabase/quotations'
import {
  quotationSchema,
  quotationStatusSchema,
  rejectQuotationSchema,
} from '@/lib/validations/quotation'
import type { QuotationFormValues } from '@/lib/validations/quotation'

// ---------------------------------------------------------------------------
// createQuotationAction
// ---------------------------------------------------------------------------
export async function createQuotationAction(values: QuotationFormValues) {
  const parsed = quotationSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid form data')

  const user = await getUser()
  const companyId = await getCompanyId()
  const quotation = await createQuotation(companyId, user.id, parsed.data)
  redirect(`/quotations/${quotation.id}`)
}

// ---------------------------------------------------------------------------
// updateQuotationAction
// ---------------------------------------------------------------------------
export async function updateQuotationAction(id: string, values: QuotationFormValues) {
  const parsed = quotationSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid form data')

  const user = await getUser()
  const companyId = await getCompanyId()
  await updateQuotation(id, companyId, parsed.data, user.id)
  redirect(`/quotations/${id}`)
}

// ---------------------------------------------------------------------------
// deleteQuotationAction
// ---------------------------------------------------------------------------
export async function deleteQuotationAction(id: string) {
  const companyId = await getCompanyId()
  await deleteQuotation(id, companyId)
  redirect('/quotations')
}

// ---------------------------------------------------------------------------
// submitQuotationAction  draft → submitted
// ---------------------------------------------------------------------------
export async function submitQuotationAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await submitQuotation(id, companyId, user.id)
  redirect(`/quotations/${id}`)
}

// ---------------------------------------------------------------------------
// approveQuotationAction
// ---------------------------------------------------------------------------
export async function approveQuotationAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await approveQuotation(id, companyId, user.id)
  redirect(`/quotations/${id}`)
}

// ---------------------------------------------------------------------------
// rejectQuotationAction
// ---------------------------------------------------------------------------
export async function rejectQuotationAction(id: string, reason: string) {
  const parsed = rejectQuotationSchema.safeParse({ rejection_reason: reason })
  if (!parsed.success) throw new Error('Rejection reason is required')

  const user = await getUser()
  const companyId = await getCompanyId()
  await rejectQuotation(id, companyId, user.id, parsed.data.rejection_reason)
  redirect(`/quotations/${id}`)
}

// ---------------------------------------------------------------------------
// shortlistQuotationAction
// ---------------------------------------------------------------------------
export async function shortlistQuotationAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await shortlistQuotation(id, companyId, user.id)
  redirect(`/quotations/${id}`)
}

// ---------------------------------------------------------------------------
// reopenQuotationAction
// ---------------------------------------------------------------------------
export async function reopenQuotationAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await reopenQuotation(id, companyId, user.id)
  redirect(`/quotations/${id}`)
}

// ---------------------------------------------------------------------------
// markUnderReviewAction
// ---------------------------------------------------------------------------
export async function markUnderReviewAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await markUnderReview(id, companyId, user.id)
  redirect(`/quotations/${id}`)
}

// ---------------------------------------------------------------------------
// addCommentAction
// ---------------------------------------------------------------------------
export async function addCommentAction(
  quotationId: string,
  comment: string,
  isInternal: boolean,
) {
  if (!comment.trim()) throw new Error('Comment cannot be empty')
  const user = await getUser()
  const companyId = await getCompanyId()
  await addQuotationComment(quotationId, companyId, user.id, comment.trim(), isInternal)
}
