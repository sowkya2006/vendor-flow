'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  createPR,
  updatePR,
  deletePR,
  updatePRStatus,
} from '@/lib/supabase/purchase-requests'
import {
  purchaseRequestSchema,
  prStatusSchema,
} from '@/lib/validations/purchase-request'
import type { PRFormValues } from '@/lib/validations/purchase-request'

export async function createPRAction(values: PRFormValues) {
  const parsed = purchaseRequestSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid form data')
  const user = await getUser()
  const companyId = await getCompanyId()
  const pr = await createPR(companyId, user.id, parsed.data)
  redirect(`/procurement/${pr.id}`)
}

export async function updatePRAction(id: string, values: PRFormValues) {
  const parsed = purchaseRequestSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid form data')
  const companyId = await getCompanyId()
  await updatePR(id, companyId, parsed.data)
  redirect(`/procurement/${id}`)
}

export async function submitPRAction(id: string) {
  const companyId = await getCompanyId()
  await updatePRStatus(id, companyId, 'submitted')
  revalidatePath(`/procurement/${id}`)
  revalidatePath('/procurement')
}

export async function approvePRAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await updatePRStatus(id, companyId, 'approved', { approvedBy: user.id })
  revalidatePath(`/procurement/${id}`)
  revalidatePath('/procurement')
}

export async function rejectPRAction(id: string, reason: string) {
  const companyId = await getCompanyId()
  await updatePRStatus(id, companyId, 'rejected', { rejectionReason: reason })
  revalidatePath(`/procurement/${id}`)
  revalidatePath('/procurement')
}

export async function cancelPRAction(id: string) {
  const companyId = await getCompanyId()
  await updatePRStatus(id, companyId, 'cancelled')
  revalidatePath(`/procurement/${id}`)
  revalidatePath('/procurement')
}

export async function deletePRAction(id: string) {
  const companyId = await getCompanyId()
  await deletePR(id, companyId)
  redirect('/procurement')
}
