import Link from 'next/link'
import { FileText, ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import {
  getApprovedPurchaseOrders,
  getActiveVendors,
  getActiveProducts,
} from '@/lib/supabase/invoices'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { createInvoiceAction } from '@/app/(dashboard)/payments/actions'

export default async function NewInvoicePage() {
  const companyId = await getCompanyId()
  const [vendors, purchaseOrders, products] = await Promise.all([
    getActiveVendors(companyId),
    getApprovedPurchaseOrders(companyId),
    getActiveProducts(companyId),
  ])

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/payments/invoices" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Back to Invoices
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">New Invoice</h1>
            <p className="text-xs text-[--color-foreground-muted]">Create a vendor invoice</p>
          </div>
        </div>
      </div>
      <div className="max-w-4xl">
        <InvoiceForm
          vendors={vendors}
          purchaseOrders={purchaseOrders}
          products={products}
          onSubmit={createInvoiceAction}
          submitLabel="Create Invoice"
        />
      </div>
    </PageContainer>
  )
}
