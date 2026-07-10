import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { ProductForm } from '@/components/inventory/product-form'
import { getProductById, getProductCategories, getVendorOptions } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { updateProductAction } from '@/app/(dashboard)/products/actions'
import type { CreateProductInput } from '@/lib/validations/inventory'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()

  const [product, categories, vendors] = await Promise.all([
    getProductById(id, companyId),
    getProductCategories(companyId),
    getVendorOptions(companyId),
  ])

  if (!product) notFound()

  async function handleUpdate(values: CreateProductInput) {
    'use server'
    await updateProductAction(id, values)
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href={`/products/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {product.name}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Edit Product</h1>
            <p className="text-xs text-[--color-foreground-muted]">{product.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <ProductForm
          categories={categories}
          vendors={vendors}
          defaultValues={{
            name: product.name,
            sku: product.sku,
            description: product.description ?? undefined,
            category_id: product.category_id ?? undefined,
            preferred_vendor_id: product.preferred_vendor_id ?? undefined,
            unit: product.unit,
            unit_cost: product.unit_cost,
            status: product.status,
            min_stock_level: product.min_stock_level,
            max_stock_level: product.max_stock_level ?? undefined,
            reorder_level: product.reorder_level,
            lead_time_days: product.lead_time_days ?? undefined,
            notes: product.notes ?? undefined,
          }}
          onSubmit={handleUpdate}
          submitLabel="Update Product"
        />
      </div>
    </PageContainer>
  )
}
