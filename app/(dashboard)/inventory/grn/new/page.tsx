import Link from 'next/link'
import { ClipboardList, ArrowLeft, AlertTriangle } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { GrnForm } from '@/components/inventory/grn-form'
import { getWarehouses, getProducts, getOpenPurchaseOrders } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { createGrnAction } from '@/app/(dashboard)/inventory/actions'
import type { Warehouse, Product } from '@/types/inventory'

export default async function NewGrnPage() {
  // Gracefully handle auth/DB failures — never crash this page
  let companyId: string | null = null
  let warehouses: Warehouse[] = []
  let products: Product[] = []
  let openPOs: Awaited<ReturnType<typeof getOpenPurchaseOrders>> = []
  let loadError: string | null = null

  try {
    companyId = await getCompanyId()
  } catch {
    loadError = 'Could not load your workspace. Please refresh the page or contact support.'
  }

  if (companyId) {
    // Load all three independently so one failure doesn't block the rest
    const [warehouseResult, productsResult, posResult] = await Promise.allSettled([
      getWarehouses(companyId, true),
      getProducts(companyId, { status: 'active', pageSize: 200 }),
      getOpenPurchaseOrders(companyId),
    ])

    if (warehouseResult.status === 'fulfilled') warehouses = warehouseResult.value
    if (productsResult.status === 'fulfilled') products = productsResult.value.data
    if (posResult.status === 'fulfilled') openPOs = posResult.value
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          href="/inventory/grn"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to GRNs
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">New Goods Receipt</h1>
            <p className="text-xs text-[--color-foreground-muted]">Record incoming stock from a Purchase Order</p>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Unable to load form</p>
            <p className="text-xs text-red-700 mt-0.5">{loadError}</p>
          </div>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">No warehouses configured</p>
            <p className="text-xs text-amber-700 mt-0.5">
              A warehouse is required to create a GRN.{' '}
              <Link href="/inventory/warehouses/new" className="underline font-medium">
                Create a warehouse first
              </Link>
              .
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl">
          <GrnForm
            warehouses={warehouses}
            products={products}
            openPOs={openPOs}
            onSubmit={createGrnAction}
          />
        </div>
      )}
    </PageContainer>
  )
}
