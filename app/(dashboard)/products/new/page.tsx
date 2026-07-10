import { Package } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { ProductForm } from '@/components/inventory/product-form'
import { getProductCategories, getVendorOptions } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { createProductAction } from '@/app/(dashboard)/products/actions'

export default async function NewProductPage() {
  const companyId = await getCompanyId()
  const [categories, vendors] = await Promise.all([
    getProductCategories(companyId),
    getVendorOptions(companyId),
  ])

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">New Product</h1>
          <p className="text-xs text-[--color-foreground-muted]">Add a product to your catalog</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <ProductForm
          categories={categories}
          vendors={vendors}
          onSubmit={createProductAction}
          submitLabel="Create Product"
        />
      </div>
    </PageContainer>
  )
}
