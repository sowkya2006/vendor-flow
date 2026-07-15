'use server'

import { redirect } from 'next/navigation'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import { createRFQ, updateRFQ, deleteRFQ } from '@/lib/supabase/rfqs'
import { rfqSchema, rfqStatusSchema } from '@/lib/validations/rfq'
import type { RFQFormValues } from '@/lib/validations/rfq'
import { triggerApproval } from '@/lib/supabase/auto-approve'
import { guardPermission } from '@/lib/supabase/permission-guard'
import { notify } from '@/lib/notifications/engine'

export async function createRFQAction(values: RFQFormValues) {
  await guardPermission('manage_rfqs')
  const parsed = rfqSchema.safeParse(values)
  if (!parsed.success) {
    console.error('[createRFQAction] validation failed:', parsed.error.flatten())
    throw new Error('Invalid form data: ' + JSON.stringify(parsed.error.flatten().fieldErrors))
  }

  const user = await getUser()
  const companyId = await getCompanyId()

  let rfq: Awaited<ReturnType<typeof createRFQ>>
  try {
    rfq = await createRFQ(companyId, user.id, parsed.data)
  } catch (err) {
    console.error('[createRFQAction] DB insert failed:', err)
    throw err
  }

  const rfqRef = (rfq as { rfq_number?: string }).rfq_number ?? rfq.id

  // Notify PM and Admin that a new RFQ needs approval
  await notify({
    event: 'RFQ_CREATED',
    companyId,
    triggeredBy: user.id,
    triggeredByName: user.user_metadata?.full_name ?? user.email ?? 'Procurement Officer',
    entityId: rfq.id,
    entityRef: rfqRef,
    entityType: 'rfq',
  })

  // Also trigger approval workflow if configured
  await triggerApproval({
    companyId,
    userId: user.id,
    entityType: 'rfq',
    entityId: rfq.id,
    entityRef: rfqRef,
    title: `RFQ: ${parsed.data.title ?? rfq.id}`,
    priority: 'normal',
  })

  redirect(`/rfqs/${rfq.id}`)
}

export async function updateRFQAction(id: string, values: RFQFormValues) {
  await guardPermission('manage_rfqs')
  const parsed = rfqSchema.safeParse(values)
  if (!parsed.success) throw new Error('Invalid form data')
  const companyId = await getCompanyId()
  await updateRFQ(id, companyId, parsed.data)
  redirect(`/rfqs/${id}`)
}

export async function deleteRFQAction(id: string) {
  await guardPermission('manage_rfqs')
  const companyId = await getCompanyId()
  await deleteRFQ(id, companyId)
  redirect('/rfqs')
}

export async function updateRFQStatusAction(id: string, status: string) {
  // Sending to vendor = PM action (approve_rfqs)
  // Officer cannot send — only PM and Admin
  await guardPermission('approve_rfqs')
  const parsed = rfqStatusSchema.safeParse({ status })
  if (!parsed.success) throw new Error('Invalid status')

  const user = await getUser()
  const companyId = await getCompanyId()
  await updateRFQ(id, companyId, { status: parsed.data.status } as Partial<RFQFormValues>)

  // When PM approves/rejects RFQ via the status action
  if (parsed.data.status === 'awarded') {
    await notify({
      event: 'RFQ_APPROVED',
      companyId,
      triggeredBy: user.id,
      entityId: id,
      entityRef: id,
      entityType: 'rfq',
    })
  } else if (parsed.data.status === 'cancelled') {
    await notify({
      event: 'RFQ_REJECTED',
      companyId,
      triggeredBy: user.id,
      entityId: id,
      entityRef: id,
      entityType: 'rfq',
    })
  } else if (parsed.data.status === 'sent') {
    // Notify company roles
    await notify({
      event: 'RFQ_SENT_TO_VENDOR',
      companyId,
      triggeredBy: user.id,
      entityId: id,
      entityRef: id,
      entityType: 'rfq',
    })

    // Notify the vendor directly — they need to know an RFQ arrived
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = createAdminClient() as any
      const { data: rfq } = await db
        .from('rfqs')
        .select('rfq_number, title, vendor_id')
        .eq('id', id)
        .maybeSingle()

      if (rfq?.vendor_id) {
        const { notifyVendor } = await import('@/lib/notifications/engine')
        await notifyVendor(rfq.vendor_id, {
          type: 'rfq_created',
          title: `New RFQ Received: ${rfq.rfq_number}`,
          body: `You have received a Request for Quotation (${rfq.rfq_number}): "${rfq.title ?? ''}". Please review and submit your quotation.`,
          link: `/vendor/rfqs/${id}`,
          entityType: 'rfq',
          entityId: id,
          companyId,
        })
      }
    } catch { /* non-critical */ }
  }}
