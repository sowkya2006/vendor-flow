import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { PaymentForm } from '@/components/invoices/payment-form'
import { getInvoiceById } from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { recordPaymentAction } from '@/app/(dashboard)/payments/actions'
import type { PaymentFormValues } from '@/lib/validations/invoice'

interface PageProps { params: Promise<{ id: string }> }

export default async function RecordPaymentPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()
  const invoice = await getInvoiceById(id, companyId)

  if (!invoice) notFound()
  if (!['approved', 'partially_paid'].includes(invoice.status)) notFound()
  if (invoice.remaining_amount <= 0) notFound()

  async function handlePayment(values: PaymentFormValues) {
    'use server'
    await recordPaymentAction(values)
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href={`/payments/invoices/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Back to {invoice.invoice_number}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Record Payment</h1>
            <p className="text-xs text-[--color-foreground-muted]">
              {invoice.invoice_number} · {invoice.vendor?.name ?? '—'}
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-md">
        <PaymentForm
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoice_number}
          remainingAmount={invoice.remaining_amount}
          currency={invoice.currency}
          onSubmit={handlePayment}
        />
      </div>
    </PageContainer>
  )
}
