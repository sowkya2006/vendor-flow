'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
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
  const companyId = await getCompanyId()
  await updateInvoiceStatus(id, companyId, 'submitted')
  revalidatePath(`/payments/invoices/${id}`)
  revalidatePath('/payments')
}

export async function approveInvoiceAction(id: string) {
  const companyId = await getCompanyId()
  await updateInvoiceStatus(id, companyId, 'approved')
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
  await recordPayment(companyId, user.id, {
    invoice_id: parsed.data.invoice_id,
    payment_date: parsed.data.payment_date,
    payment_method: parsed.data.payment_method,
    amount: parsed.data.amount,
    notes: parsed.data.notes ?? null,
  })
  revalidatePath(`/payments/invoices/${parsed.data.invoice_id}`)
  revalidatePath('/payments')
  redirect(`/payments/invoices/${parsed.data.invoice_id}`)
}
