import Link from 'next/link'
import { Warehouse, Plus, Pencil, MapPin } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { EmptyState } from '@/components/shared/loading-states'
import { getWarehouses } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function WarehousesPage() {
  const companyId = await getCompanyId()
  const warehouses = await getWarehouses(companyId)

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Warehouses</h1>
            <p className="text-xs text-[--color-foreground-muted]">Manage your storage locations</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/inventory/warehouses/new"><Plus className="h-4 w-4 mr-1" />New Warehouse</Link>
        </Button>
      </div>

      {warehouses.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="h-8 w-8" />}
          title="No warehouses yet"
          description="Create your first warehouse to start tracking stock locations."
          action={
            <Button asChild>
              <Link href="/inventory/warehouses/new"><Plus className="h-4 w-4 mr-1" />New Warehouse</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <div
              key={w.id}
              className={cn(
                'rounded-xl border bg-[--color-card] p-5 shadow-[--shadow-sm]',
                w.is_default ? 'border-[--color-primary]/40' : 'border-[--color-border]',
                !w.is_active && 'opacity-60',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
                    <Warehouse className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-[--color-foreground] truncate">{w.name}</p>
                      {w.is_default && (
                        <span className="rounded-full bg-[--color-primary]/10 px-2 py-0.5 text-[10px] font-medium text-[--color-primary]">
                          Default
                        </span>
                      )}
                      {!w.is_active && (
                        <span className="rounded-full bg-[--color-muted] px-2 py-0.5 text-[10px] font-medium text-[--color-foreground-muted]">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[--color-foreground-muted]">Code: {w.code}</p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Link href={`/inventory/warehouses/${w.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {w.address && (
                <div className="mt-3 flex items-start gap-1.5 text-xs text-[--color-foreground-muted]">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{w.address}</span>
                </div>
              )}

              <div className="mt-3">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/inventory?warehouse_id=${w.id}`}>View Stock</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
