import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Warehouse, ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { WarehouseForm } from '@/components/inventory/warehouse-form'
import { getWarehouseById } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { updateWarehouseAction } from '@/app/(dashboard)/inventory/actions'
import type { CreateWarehouseInput } from '@/lib/validations/inventory'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditWarehousePage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()
  const warehouse = await getWarehouseById(id, companyId)

  if (!warehouse) notFound()

  async function handleUpdate(values: CreateWarehouseInput) {
    'use server'
    await updateWarehouseAction(id, values)
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/inventory/warehouses" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Warehouses
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Edit Warehouse</h1>
            <p className="text-xs text-[--color-foreground-muted]">{warehouse.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
        <WarehouseForm
          defaultValues={{
            name: warehouse.name,
            code: warehouse.code,
            address: warehouse.address ?? undefined,
            is_default: warehouse.is_default,
            is_active: warehouse.is_active,
          }}
          onSubmit={handleUpdate}
          submitLabel="Update Warehouse"
        />
      </div>
    </PageContainer>
  )
}
