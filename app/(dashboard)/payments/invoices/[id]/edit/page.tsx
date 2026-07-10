import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import {
  getInvoiceById,
  getApprovedPurchaseOrders,
  getActiveVendors,
  getActiveProducts,
} from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { updateInvoiceAction } from '@/app/(dashboard)/payments/actions'
import type { InvoiceFormValues } from '@/lib/validations/invoice'

interface PageProps { params: Promise<{ id: string }> }

export default async function EditInvoicePage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()

  const [invoice, vendors, purchaseOrders, products] = await Promise.all([
    getInvoiceById(id, companyId),
    getActiveVendors(companyId),
    getApprovedPurchaseOrders(companyId),
    getActiveProducts(companyId),
  ])

  if (!invoice) notFound()
  if (invoice.status !== 'draft') {
    notFound() // can only edit drafts
  }

  async function handleUpdate(values: InvoiceFormValues) {
    'use server'
    await updateInvoiceAction(id, values)
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href={`/payments/invoices/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Back to {invoice.invoice_number}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Edit Invoice</h1>
            <p className="text-xs text-[--color-foreground-muted]">{invoice.invoice_number}</p>
          </div>
        </div>
      </div>
      <div className="max-w-4xl">
        <InvoiceForm
          vendors={vendors}
          purchaseOrders={purchaseOrders}
          products={products}
          defaultValues={{
            purchase_order_id: invoice.purchase_order_id ?? undefined,
            vendor_id: invoice.vendor_id,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date ?? undefined,
            discount_amount: invoice.discount_amount,
            currency: invoice.currency,
            notes: invoice.notes ?? undefined,
            items: (invoice.items ?? []).map((item) => ({
              product_id: item.product_id ?? undefined,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              tax_percentage: item.tax_percentage,
            })),
          }}
          onSubmit={handleUpdate}
          submitLabel="Update Invoice"
        />
      </div>
    </PageContainer>
  )
}
