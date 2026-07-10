import Link from 'next/link'
import { ClipboardList, ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { GrnForm } from '@/components/inventory/grn-form'
import { getWarehouses, getProducts, getOpenPurchaseOrders } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { createGrnAction } from '@/app/(dashboard)/inventory/actions'

export default async function NewGrnPage() {
  const companyId = await getCompanyId()
  const [warehouses, productsResult, openPOs] = await Promise.all([
    getWarehouses(companyId, true),
    getProducts(companyId, { status: 'active', pageSize: 200 }),
    getOpenPurchaseOrders(companyId),
  ])

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/inventory/grn" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to GRNs
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">New Goods Receipt</h1>
            <p className="text-xs text-[--color-foreground-muted]">Record incoming stock</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl">
        <GrnForm
          warehouses={warehouses}
          products={productsResult.data}
          openPOs={openPOs}
          onSubmit={createGrnAction}
        />
      </div>
    </PageContainer>
  )
}
