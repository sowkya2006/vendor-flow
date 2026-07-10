import Link from 'next/link'
import { Warehouse, ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { WarehouseForm } from '@/components/inventory/warehouse-form'
import { createWarehouseAction } from '@/app/(dashboard)/inventory/actions'

export default function NewWarehousePage() {
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
            <h1 className="text-xl font-semibold text-[--color-foreground]">New Warehouse</h1>
            <p className="text-xs text-[--color-foreground-muted]">Add a storage location</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
        <WarehouseForm onSubmit={createWarehouseAction} submitLabel="Create Warehouse" />
      </div>
    </PageContainer>
  )
}
