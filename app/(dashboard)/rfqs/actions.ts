'use server'

import { redirect } from 'next/navigation'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import { createRFQ, updateRFQ, deleteRFQ } from '@/lib/supabase/rfqs'
import { rfqSchema, rfqStatusSchema } from '@/lib/validations/rfq'
import type { RFQFormValues } from '@/lib/validations/rfq'

export async function createRFQAction(values: RFQFormValues) {
  const parsed = rfqSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid form data')
  }

  const user = await getUser()
  const companyId = await getCompanyId()
  const rfq = await createRFQ(companyId, user.id, parsed.data)
  redirect(`/rfqs/${rfq.id}`)
}

export async function updateRFQAction(id: string, values: RFQFormValues) {
  const parsed = rfqSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid form data')
  }

  const companyId = await getCompanyId()
  await updateRFQ(id, companyId, parsed.data)
  redirect(`/rfqs/${id}`)
}

export async function deleteRFQAction(id: string) {
  const companyId = await getCompanyId()
  await deleteRFQ(id, companyId)
  redirect('/rfqs')
}

export async function updateRFQStatusAction(id: string, status: string) {
  const parsed = rfqStatusSchema.safeParse({ status })
  if (!parsed.success) throw new Error('Invalid status')

  const companyId = await getCompanyId()
  await updateRFQ(id, companyId, { status: parsed.data.status } as Partial<RFQFormValues>)
}
