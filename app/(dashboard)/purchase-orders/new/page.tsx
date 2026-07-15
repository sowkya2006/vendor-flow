import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, ShoppingCart, AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { canCreatePO } from '@/config/nav-roles'
import { getApprovedQuotationsForPO } from '@/lib/supabase/quotations'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { POFromQuotationClient } from '@/components/purchase-orders/po-from-quotation-client'

export const metadata: Metadata = { title: 'New Purchase Order — VendorFlow' }

interface PageProps {
  searchParams: Promise<{ quotation_id?: string }>
}

export default async function NewPurchaseOrderPage({ searchParams }: PageProps) {
  const [companyId, role] = await Promise.all([getCompanyId(), getUserRole()])
  if (!canCreatePO(role)) redirect('/purchase-orders')

  const params = await searchParams
  const preselectedQuotationId = params.quotation_id ?? null

  // Fetch all approved quotations without a PO
  const approvedQuotations = await getApprovedQuotationsForPO(companyId)

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="New Purchase Order"
        description="Purchase Orders must be created from an approved quotation."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/purchase-orders">
              <ChevronLeft className="h-4 w-4" />
              Back to POs
            </Link>
          </Button>
        }
      />
      <PageContainer className="max-w-4xl">
        {approvedQuotations.length === 0 ? (
          // No approved quotations available
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-8 text-center space-y-3 shadow-[var(--shadow-sm)]">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <h2 className="text-base font-semibold text-[--color-foreground]">
              No Approved Quotations Available
            </h2>
            <p className="text-sm text-[--color-foreground-muted] max-w-md mx-auto">
              A Purchase Order can only be created from a Procurement Manager-approved quotation.
              There are currently no approved quotations without an existing PO.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button asChild variant="outline">
                <Link href="/quotations">View Quotations</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/rfqs">View RFQs</Link>
              </Button>
            </div>
          </div>
        ) : (
          <POFromQuotationClient
            approvedQuotations={approvedQuotations}
            preselectedQuotationId={preselectedQuotationId}
          />
        )}
      </PageContainer>
    </div>
  )
}
