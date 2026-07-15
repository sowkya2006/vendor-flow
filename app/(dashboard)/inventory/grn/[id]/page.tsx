import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, ArrowLeft, CheckCircle, XCircle, Warehouse, RefreshCw } from 'lucide-react'
import { PageContainer } from '@/components/shared/page-container'
import { GrnStatusBadge } from '@/components/inventory/stock-status-badge'
import { getGrnById } from '@/lib/supabase/inventory'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { completeGrnAction, cancelGrnAction, deleteGrnAction, resyncGrnInventoryAction } from '@/app/(dashboard)/inventory/actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GrnDetailPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()
  const grn = await getGrnById(id, companyId)

  if (!grn) notFound()

  const isDraft = grn.status === 'draft'
  const totalValue = (grn.grn_items ?? []).reduce(
    (sum, item) => sum + item.received_quantity * item.unit_cost,
    0,
  )

  return (
    <PageContainer>
      {/* Back */}
      <div className="mb-6">
        <Link href="/inventory/grn" className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to GRNs
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[--color-foreground]">{grn.grn_number}</h1>
                <GrnStatusBadge status={grn.status} />
              </div>
              <p className="text-xs text-[--color-foreground-muted]">
                Received {formatDate(grn.received_date)}
                {(grn.warehouse as { name: string } | undefined)?.name ? ` · ${(grn.warehouse as { name: string }).name}` : ''}
              </p>
            </div>
          </div>

          {isDraft && (
            <div className="flex items-center gap-2">
              <form action={cancelGrnAction.bind(null, id)}>
                <Button type="submit" variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Cancel
                </Button>
              </form>
              <form action={completeGrnAction.bind(null, id)}>
                <Button type="submit" size="sm">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Complete &amp; Update Stock
                </Button>
              </form>
            </div>
          )}
          {grn.status === 'completed' && (
            <form action={resyncGrnInventoryAction.bind(null, id)}>
              <Button type="submit" variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Re-sync Inventory
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
            <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-3">
              <h2 className="text-sm font-semibold text-[--color-foreground]">Received Items</h2>
              <span className="text-xs text-[--color-foreground-muted]">{(grn.grn_items ?? []).length} item{(grn.grn_items ?? []).length !== 1 ? 's' : ''}</span>
            </div>

            {(grn.grn_items ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-medium text-[--color-foreground-muted]">No items on this GRN.</p>
                <p className="text-xs text-[--color-foreground-subtle] mt-1">
                  Items were not saved. Please delete this GRN and create a new one with a Purchase Order selected.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[--color-border]">
                {(grn.grn_items ?? []).map((item) => {
                  // Display name priority: linked product name → item_name → notes → "—"
                  const displayName = item.product?.name ?? (item as { item_name?: string }).item_name ?? item.notes ?? '—'
                  const displaySku = item.product?.sku ?? (item as { sku?: string }).sku ?? null
                  const displayUnit = item.product?.unit ?? (item as { unit?: string }).unit ?? null
                  const acceptedQty = (item as { accepted_quantity?: number }).accepted_quantity
                  const rejectedQty = (item as { rejected_quantity?: number }).rejected_quantity
                  const batchNum = (item as { batch_number?: string }).batch_number
                  const warehouseLoc = (item as { warehouse_location?: string }).warehouse_location
                  const damageNotes = (item as { damage_notes?: string }).damage_notes

                  return (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[--color-foreground] truncate">
                            {displayName}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            {displaySku && <p className="text-xs text-[--color-foreground-muted]">SKU: {displaySku}</p>}
                            {displayUnit && <p className="text-xs text-[--color-foreground-muted]">Unit: {displayUnit}</p>}
                            {batchNum && <p className="text-xs text-[--color-foreground-muted]">Batch: {batchNum}</p>}
                            {warehouseLoc && <p className="text-xs text-[--color-foreground-muted]">Location: {warehouseLoc}</p>}
                          </div>
                          {damageNotes && (
                            <p className="text-xs text-red-600 mt-1">⚠ Damage: {damageNotes}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          <p className="text-sm font-semibold text-[--color-foreground]">
                            {item.received_quantity} received
                          </p>
                          {item.ordered_quantity > 0 && (
                            <p className="text-xs text-[--color-foreground-muted]">
                              of {item.ordered_quantity} ordered
                            </p>
                          )}
                          {(acceptedQty != null || rejectedQty != null) && (
                            <div className="flex items-center gap-2 text-xs">
                              {acceptedQty != null && <span className="text-emerald-600">{acceptedQty} accepted</span>}
                              {rejectedQty != null && rejectedQty > 0 && <span className="text-red-600">{rejectedQty} rejected</span>}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0 min-w-[90px]">
                          <p className="text-xs font-medium text-[--color-foreground]">
                            {formatCurrency(item.unit_cost)} / unit
                          </p>
                          <p className="text-xs text-[--color-foreground-muted]">
                            {formatCurrency(item.received_quantity * item.unit_cost)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {(grn.grn_items ?? []).length > 0 && (
              <div className="flex items-center justify-between border-t border-[--color-border] px-5 py-3 bg-[--color-background-subtle]">
                <span className="text-sm font-medium text-[--color-foreground-muted]">Total Receipt Value</span>
                <span className="text-sm font-bold text-[--color-foreground]">{formatCurrency(totalValue)}</span>
              </div>
            )}
          </div>

          {grn.status === 'completed' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Stock levels updated — this GRN has been completed and inventory adjusted.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Details sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[--color-foreground]">Details</h2>
            {[
              { label: 'GRN Number', value: grn.grn_number },
              { label: 'Status', value: <GrnStatusBadge status={grn.status} /> },
              { label: 'Warehouse', value: (grn.warehouse as { name: string } | undefined)?.name ?? '—' },
              { label: 'Received Date', value: formatDate(grn.received_date) },
              {
                label: 'Purchase Order',
                value: grn.purchase_order
                  ? <Link href={`/purchase-orders/${(grn.purchase_order as { id: string }).id}`} className="text-[--color-primary] hover:underline">{(grn.purchase_order as { po_number: string }).po_number}</Link>
                  : '—'
              },
              { label: 'Created', value: formatDate(grn.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-[--color-foreground-muted] shrink-0">{label}</span>
                <span className="text-right font-medium text-[--color-foreground]">{value}</span>
              </div>
            ))}
          </div>

          {grn.notes && (
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5">
              <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Notes</h2>
              <p className="text-sm text-[--color-foreground-muted] whitespace-pre-wrap">{grn.notes}</p>
            </div>
          )}

          {isDraft && (
            <form action={deleteGrnAction.bind(null, id)}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                Delete Draft
              </Button>
            </form>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
