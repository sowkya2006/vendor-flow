import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Pencil, Send, CheckCircle2, XCircle, CreditCard } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge'
import { InvoiceItemsTable } from '@/components/invoices/invoice-items-table'
import { PaymentTimeline } from '@/components/invoices/payment-timeline'
import { getInvoiceById } from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  submitInvoiceAction,
  approveInvoiceAction,
  cancelInvoiceAction,
  deleteInvoiceAction,
} from '@/app/(dashboard)/payments/actions'

interface PageProps { params: Promise<{ id: string }> }

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()
  const invoice = await getInvoiceById(id, companyId)
  if (!invoice) notFound()

  const isDraft = invoice.status === 'draft'
  const isSubmitted = invoice.status === 'submitted'
  const isApproved = invoice.status === 'approved' || invoice.status === 'partially_paid'
  const isCancellable = !['paid', 'cancelled'].includes(invoice.status)
  const canPay = isApproved && invoice.remaining_amount > 0
  const isOverdue =
    invoice.due_date &&
    !['paid', 'cancelled'].includes(invoice.status) &&
    new Date(invoice.due_date) < new Date()

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/payments/invoices" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Back to Invoices
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-[--color-foreground]">{invoice.invoice_number}</h1>
                <InvoiceStatusBadge status={invoice.status} />
                {isOverdue && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
                )}
              </div>
              <p className="text-xs text-[--color-foreground-muted]">
                {invoice.vendor?.name ?? '—'} · {formatDate(invoice.invoice_date)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isDraft && (
              <>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/payments/invoices/${id}/edit`}><Pencil className="h-3.5 w-3.5 mr-1.5" />Edit</Link>
                </Button>
                <form action={submitInvoiceAction.bind(null, id)}>
                  <Button type="submit" size="sm"><Send className="h-3.5 w-3.5 mr-1.5" />Submit</Button>
                </form>
              </>
            )}
            {isSubmitted && (
              <form action={approveInvoiceAction.bind(null, id)}>
                <Button type="submit" size="sm"><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Approve</Button>
              </form>
            )}
            {canPay && (
              <Button asChild size="sm">
                <Link href={`/payments/invoices/${id}/pay`}><CreditCard className="h-3.5 w-3.5 mr-1.5" />Record Payment</Link>
              </Button>
            )}
            {isCancellable && (
              <form action={cancelInvoiceAction.bind(null, id)}>
                <Button type="submit" size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />Cancel
                </Button>
              </form>
            )}
            {isDraft && (
              <form action={deleteInvoiceAction.bind(null, id)}>
                <Button type="submit" size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Delete
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment progress bar */}
          {invoice.status !== 'draft' && invoice.status !== 'cancelled' && invoice.total_amount > 0 && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[--color-foreground-muted]">Payment Progress</span>
                <span className="font-semibold text-[--color-foreground]">
                  {formatCurrency(invoice.paid_amount)} / {formatCurrency(invoice.total_amount)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[--color-muted] overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, (invoice.paid_amount / invoice.total_amount) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-[--color-foreground-muted]">
                {formatCurrency(invoice.remaining_amount)} remaining
              </p>
            </div>
          )}

          {/* Line items */}
          {(invoice.items ?? []).length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-[--color-foreground]">Line Items</h2>
              <InvoiceItemsTable
                items={invoice.items ?? []}
                subtotal={invoice.subtotal}
                taxAmount={invoice.tax_amount}
                discountAmount={invoice.discount_amount}
                totalAmount={invoice.total_amount}
              />
            </div>
          )}

          {/* Payment history */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-[--color-foreground]">Payment History</h2>
            <PaymentTimeline payments={invoice.payments ?? []} currency={invoice.currency} />
          </div>

          {invoice.notes && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Notes</h2>
              <p className="text-sm text-[--color-foreground-muted] whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[--color-foreground]">Invoice Details</h2>
            {(
              [
                { label: 'Invoice #', value: invoice.invoice_number },
                { label: 'Status', value: <InvoiceStatusBadge status={invoice.status} /> },
                { label: 'Vendor', value: invoice.vendor?.name ?? '—' },
                { label: 'Invoice Date', value: formatDate(invoice.invoice_date) },
                { label: 'Due Date', value: invoice.due_date ? <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>{formatDate(invoice.due_date)}</span> : '—' },
                { label: 'Currency', value: invoice.currency },
                invoice.purchase_order
                  ? { label: 'Purchase Order', value: <Link href={`/purchase-orders/${(invoice.purchase_order as { id: string }).id}`} className="text-[--color-primary] hover:underline">{(invoice.purchase_order as { po_number: string }).po_number}</Link> }
                  : null,
              ] as Array<{ label: string; value: React.ReactNode } | null>
            ).filter((item): item is { label: string; value: React.ReactNode } => item !== null)
              .map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-[--color-foreground-muted] shrink-0">{label}</span>
                <span className="text-right font-medium text-[--color-foreground]">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-2">
            <h2 className="text-sm font-semibold text-[--color-foreground]">Amount Summary</h2>
            {[
              { label: 'Subtotal', value: formatCurrency(invoice.subtotal) },
              { label: 'Tax', value: formatCurrency(invoice.tax_amount) },
              ...(invoice.discount_amount > 0 ? [{ label: 'Discount', value: `−${formatCurrency(invoice.discount_amount)}` }] : []),
              { label: 'Total', value: formatCurrency(invoice.total_amount), bold: true },
              { label: 'Paid', value: formatCurrency(invoice.paid_amount) },
              { label: 'Remaining', value: formatCurrency(invoice.remaining_amount), bold: true },
            ].map(({ label, value, bold }) => (
              <div key={label} className={`flex justify-between text-sm ${bold ? 'font-bold border-t border-[--color-border] pt-2 mt-1' : ''}`}>
                <span className="text-[--color-foreground-muted]">{label}</span>
                <span className="text-[--color-foreground]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
