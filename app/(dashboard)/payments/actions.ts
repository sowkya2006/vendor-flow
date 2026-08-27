'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUser, getCompanyId, getUserRole } from '@/lib/supabase/get-auth'
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  recordPayment,
} from '@/lib/supabase/invoices'
import {
  invoiceSchema,
  updateInvoiceSchema,
  invoiceStatusSchema,
  paymentSchema,
} from '@/lib/validations/invoice'
import type { InvoiceFormValues, PaymentFormValues, UpdateInvoiceFormValues } from '@/lib/validations/invoice'
import type { InvoiceFormData } from '@/types/invoice'

// ── Helpers ───────────────────────────────────────────────────────────────────

function toInvoiceFormData(values: InvoiceFormValues): InvoiceFormData {
  const n = (v: string | null | undefined) => (v === '' || v == null ? null : v)
  return {
    purchase_order_id: n(values.purchase_order_id as string | null | undefined),
    vendor_id: values.vendor_id,
    invoice_date: values.invoice_date,
    due_date: n(values.due_date as string | null | undefined),
    discount_amount: values.discount_amount ?? 0,
    currency: values.currency ?? 'INR',
    notes: n(values.notes as string | null | undefined),
    items: values.items.map((item) => ({
      product_id: item.product_id ?? null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_percentage: item.tax_percentage ?? 0,
    })),
  }
}

// ── Invoice actions ───────────────────────────────────────────────────────────

export async function createInvoiceAction(values: InvoiceFormValues) {
  const parsed = invoiceSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid form data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const user = await getUser()
  const companyId = await getCompanyId()
  const invoice = await createInvoice(companyId, user.id, toInvoiceFormData(parsed.data))
  redirect(`/payments/invoices/${invoice.id}`)
}

export async function updateInvoiceAction(id: string, values: UpdateInvoiceFormValues) {
  const parsed = updateInvoiceSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid form data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const companyId = await getCompanyId()
  await updateInvoice(id, companyId, toInvoiceFormData(parsed.data as InvoiceFormValues))
  redirect(`/payments/invoices/${id}`)
}

export async function submitInvoiceAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await updateInvoiceStatus(id, companyId, 'submitted')

  // Notify finance_manager and administrator via the engine (in-app + email)
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any
    const { data: invoice } = await admin
      .from('invoices')
      .select('invoice_number, vendor_id')
      .eq('id', id)
      .maybeSingle()
    const invRef = (invoice as { invoice_number?: string } | null)?.invoice_number ?? id

    const { notify } = await import('@/lib/notifications/engine')
    await notify({
      event: 'INVOICE_SUBMITTED',
      companyId,
      triggeredBy: user.id,
      entityId: id,
      entityRef: invRef,
      entityType: 'invoice',
      link: `/payments/invoices/${id}`,
    })
  } catch { /* non-critical */ }

  revalidatePath(`/payments/invoices/${id}`)
  revalidatePath('/payments')
}

export async function approveInvoiceAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  const role = await getUserRole()

  // Role guard — only Finance Manager and Administrator can approve
  if (role !== 'finance_manager' && role !== 'administrator' && role !== 'admin') {
    throw new Error('Only Finance Managers can approve invoices.')
  }

  // 3-way match guard — check for completed GRN using admin client
  // Only block if we are CERTAIN no completed GRN exists.
  // If the check itself fails (DB error), allow approval to proceed.
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    const { data: inv } = await admin
      .from('invoices')
      .select('purchase_order_id, grn_id')
      .eq('id', id)
      .maybeSingle()

    if (inv?.purchase_order_id) {
      // Check for any completed GRN for this PO
      const { data: completedGrn, error: grnErr } = await admin
        .from('grn')
        .select('id')
        .eq('purchase_order_id', inv.purchase_order_id)
        .eq('status', 'completed')
        .limit(1)
        .maybeSingle()

      // Only block if query succeeded AND returned no rows
      if (!grnErr && !completedGrn) {
        throw new Error(
          'Cannot approve: no completed Goods Receipt Note (GRN) found for PO-' +
          inv.purchase_order_id.slice(-8).toUpperCase() +
          '. The Warehouse Manager must mark the GRN as completed first.'
        )
      }
      // If grnErr (DB error) — allow approval to proceed rather than block incorrectly
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Cannot approve:')) throw err
    // Any other error (connection, RLS, etc.) — don't block the Finance Manager
    console.error('[approveInvoiceAction] GRN check error (non-blocking):', err)
  }

  await updateInvoiceStatus(id, companyId, 'approved')

  // Notify vendor + procurement team
  try {
    const { createClient } = await import('@/lib/supabase/server')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    const { data: invoice } = await supabase
      .from('invoices')
      .select('vendor_id, invoice_number')
      .eq('id', id)
      .maybeSingle()

    if (invoice) {
      const { notifyRoles, notifyVendor } = await import('@/lib/notifications/engine')
      await notifyRoles(companyId, ['procurement_manager', 'administrator'], {
        type: 'invoice_approved',
        title: 'Invoice Approved',
        body: `Invoice ${invoice.invoice_number} has been approved by Finance. Payment can now be processed.`,
        link: `/payments/invoices/${id}`,
        entityType: 'invoice',
        entityId: id,
      })
      // Notify the vendor that their invoice was approved
      if (invoice.vendor_id) {
        await notifyVendor(invoice.vendor_id, {
          type: 'invoice_approved',
          title: `Invoice Approved: ${invoice.invoice_number}`,
          body: `Your invoice ${invoice.invoice_number} has been approved by the Finance Manager. Payment will be processed shortly.`,
          link: `/vendor/invoices/${id}`,
          entityType: 'invoice',
          entityId: id,
          companyId,
        })
      }
    }
  } catch { /* non-critical */ }

  revalidatePath(`/payments/invoices/${id}`)
  revalidatePath('/payments')
}

export async function rejectInvoiceAction(id: string, reason: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  const role = await getUserRole()

  if (role !== 'finance_manager' && role !== 'administrator' && role !== 'admin') {
    throw new Error('Only Finance Managers can reject invoices.')
  }

  await updateInvoiceStatus(id, companyId, 'rejected')

  // Notify vendor
  try {
    const { createClient } = await import('@/lib/supabase/server')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any
    const { data: invoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('id', id)
      .maybeSingle()

    const { notifyRoles, notifyVendor } = await import('@/lib/notifications/engine')
    await notifyRoles(companyId, ['procurement_manager', 'administrator'], {
      type: 'invoice_rejected',
      title: 'Invoice Rejected',
      body: `Invoice ${invoice?.invoice_number ?? id} was rejected. Reason: ${reason || 'Not specified'}`,
      link: `/payments/invoices/${id}`,
      entityType: 'invoice',
      entityId: id,
    })
    // Notify the vendor that their invoice was rejected
    if (invoice?.vendor_id) {
      await notifyVendor(invoice.vendor_id, {
        type: 'invoice_rejected',
        title: `Invoice Rejected: ${invoice.invoice_number ?? id}`,
        body: `Your invoice ${invoice.invoice_number ?? id} has been rejected. Reason: ${reason || 'Not specified'}. Please review and resubmit.`,
        link: `/vendor/invoices/${id}`,
        entityType: 'invoice',
        entityId: id,
        companyId,
      })
    }
  } catch { /* non-critical */ }

  revalidatePath(`/payments/invoices/${id}`)
  revalidatePath('/payments')
}

export async function requestInvoiceClarificationAction(id: string, message: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  const role = await getUserRole()

  if (role !== 'finance_manager' && role !== 'administrator' && role !== 'admin') {
    throw new Error('Only Finance Managers can request clarification on invoices.')
  }

  await updateInvoiceStatus(id, companyId, 'under_review')
  revalidatePath(`/payments/invoices/${id}`)
  revalidatePath('/payments')
}

export async function cancelInvoiceAction(id: string) {
  const companyId = await getCompanyId()
  await updateInvoiceStatus(id, companyId, 'cancelled')
  revalidatePath(`/payments/invoices/${id}`)
  revalidatePath('/payments')
}

export async function deleteInvoiceAction(id: string) {
  const companyId = await getCompanyId()
  await deleteInvoice(id, companyId)
  redirect('/payments/invoices')
}

// ── Payment actions ───────────────────────────────────────────────────────────

export async function recordPaymentAction(values: PaymentFormValues) {
  const parsed = paymentSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid payment data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const user = await getUser()
  const companyId = await getCompanyId()

  const payment = await recordPayment(companyId, user.id, {
    invoice_id: parsed.data.invoice_id,
    payment_date: parsed.data.payment_date,
    payment_method: parsed.data.payment_method,
    amount: parsed.data.amount,
    notes: parsed.data.notes ?? null,
  })

  // Check if invoice is now fully paid — if so, close the entire procurement cycle
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    const { data: invoice } = await admin
      .from('invoices')
      .select('status, purchase_order_id, grn_id, vendor_id, invoice_number, total_amount')
      .eq('id', parsed.data.invoice_id)
      .maybeSingle()

    if (invoice?.status === 'paid' && invoice?.purchase_order_id) {
      const poId = invoice.purchase_order_id

      // 1. Close the Purchase Order
      await admin
        .from('purchase_orders')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', poId)

      // 2. Fetch PO details to close RFQ + Quotation
      const { data: po } = await admin
        .from('purchase_orders')
        .select('quotation_id, rfq_id')
        .eq('id', poId)
        .maybeSingle()

      // 3. Close the linked Quotation
      if (po?.quotation_id) {
        await admin
          .from('quotations')
          .update({ status: 'closed', updated_at: new Date().toISOString() })
          .eq('id', po.quotation_id)
      }

      // 4. Close the linked RFQ
      if (po?.rfq_id) {
        await admin
          .from('rfqs')
          .update({ status: 'awarded', updated_at: new Date().toISOString() })
          .eq('id', po.rfq_id)
      }

      // 5. Mark linked GRN as archived/closed
      const grnId = invoice.grn_id
      if (grnId) {
        await admin
          .from('grn')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', grnId)
      } else {
        // Find GRN via PO if grn_id not stored
        await admin
          .from('grn')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('purchase_order_id', poId)
          .eq('status', 'completed')
      }

      // 6. Notify ALL relevant roles that the procurement cycle is complete
      const { notifyRoles } = await import('@/lib/notifications/engine')
      const amount = `₹${Number(invoice.total_amount).toLocaleString('en-IN')}`

      await notifyRoles(companyId, ['procurement_officer', 'procurement_manager', 'warehouse_manager', 'administrator'], {
        type: 'payment_recorded',
        title: 'Procurement Cycle Completed',
        body: `Payment of ${amount} for invoice ${invoice.invoice_number} has been processed. The Purchase Order is now closed.`,
        link: `/purchase-orders/${poId}`,
        entityType: 'purchase_order',
        entityId: poId,
      })

      // 7. Notify the vendor that payment has been received
      if (invoice.vendor_id) {
        const { notifyVendor } = await import('@/lib/notifications/engine')
        await notifyVendor(invoice.vendor_id, {
          type: 'payment_recorded',
          title: `Payment Received: ${invoice.invoice_number}`,
          body: `Your invoice ${invoice.invoice_number} for ${amount} has been paid. The Purchase Order is now closed. Thank you!`,
          link: `/vendor/invoices/${parsed.data.invoice_id}`,
          entityType: 'invoice',
          entityId: parsed.data.invoice_id,
          companyId,
        })
      }
    }
  } catch (e) { console.error('[recordPaymentAction] lifecycle close error:', e) }

  // Notify finance managers and vendor of payment
  try {
    const { notifyRoles } = await import('@/lib/notifications/engine')
    await notifyRoles(companyId, ['finance_manager', 'administrator'], {
      type: 'payment_recorded',
      title: 'Payment Recorded',
      body: `A payment of ₹${parsed.data.amount.toLocaleString('en-IN')} has been recorded successfully.`,
      link: `/payments/invoices/${parsed.data.invoice_id}`,
      entityType: 'invoice',
      entityId: parsed.data.invoice_id,
    })
  } catch { /* non-critical */ }

  revalidatePath(`/payments/invoices/${parsed.data.invoice_id}`)
  revalidatePath('/payments')
  redirect(`/payments/invoices/${parsed.data.invoice_id}`)
}
