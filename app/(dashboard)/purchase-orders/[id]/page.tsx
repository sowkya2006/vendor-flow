import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Building2, Calendar, Clock, Edit,
  Package, DollarSign, MapPin, FileText, FileSearch,
} from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { getPurchaseOrderById } from '@/lib/supabase/purchase-orders'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { POStatusBadge } from '@/components/rfqs/rfq-status-badge'
import { PODeleteButton } from '@/components/purchase-orders/po-delete-button'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatCurrency } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { canCreatePO, canApprove } from '@/config/nav-roles'
import { POActionButtons } from '@/components/purchase-orders/po-action-buttons'

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const companyId = await getCompanyId()
  const po = await getPurchaseOrderById(id, companyId)
  return { title: po ? `${po.po_number} — VendorFlow` : 'PO Not Found — VendorFlow' }
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[--color-accent] text-[--color-foreground-muted]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[--color-foreground-muted]">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-[--color-foreground]">{value}</div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let companyId: string
  let role: string
  try {
    ;[companyId, role] = await Promise.all([getCompanyId(), getUserRole()])
  } catch {
    notFound()
    return null // unreachable, for TS
  }

  let po: Awaited<ReturnType<typeof getPurchaseOrderById>>
  try {
    po = await getPurchaseOrderById(id, companyId!)
  } catch {
    notFound()
    return null
  }

  if (!po) notFound()

  const canEdit = canCreatePO(role!)

  const isOverdue =
    po!.due_date &&
    po!.status !== 'completed' &&
    po!.status !== 'cancelled' &&
    new Date(po!.due_date) < new Date()

  // Safe date helpers — guard null created_at / updated_at
  const createdAt = po!.created_at ? new Date(po!.created_at) : null
  const updatedAt = po!.updated_at ? new Date(po!.updated_at) : null

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={po!.po_number}
        description={`Purchase Order · ${createdAt ? `Created ${formatDistanceToNow(createdAt, { addSuffix: true })}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/purchase-orders">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {/* Workflow action buttons — role-aware */}
            <POActionButtons poId={po!.id} status={po!.status} role={role!} />
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/purchase-orders/${po!.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
            {canEdit && <PODeleteButton poId={po!.id} />}
          </div>
        }
      />

      <PageContainer className="max-w-5xl">
        {/* ── Quotation provenance banner ── */}
        {po!.quotation && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[--color-primary]/20 bg-[--color-primary]/5 px-4 py-3.5">
            <FileSearch className="h-4 w-4 text-[--color-primary] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[--color-foreground] mb-1">
                Generated from Approved Quotation
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[--color-foreground-muted]">
                <span>Quotation: <Link href={`/quotations/${po!.quotation.id}`} className="text-[--color-primary] hover:underline font-medium">{po!.quotation.quotation_number}</Link></span>
                {po!.quotation.rfq && (
                  <span>RFQ: <Link href={`/rfqs/${po!.quotation.rfq.id}`} className="text-[--color-primary] hover:underline font-medium">{po!.quotation.rfq.rfq_number} — {po!.quotation.rfq.title}</Link></span>
                )}
                {po!.quotation.grand_total != null && (
                  <span>Quoted Amount: <strong className="text-[--color-foreground]">{formatCurrency(po!.quotation.grand_total)}</strong></span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left: main content ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Line Items */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
              <div className="flex items-center justify-between border-b border-[--color-border] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[--color-foreground-muted]" />
                  <h2 className="text-sm font-semibold text-[--color-foreground]">Line Items</h2>
                </div>
                {po!.items && po!.items.length > 0 && (
                  <span className="rounded-full bg-[--color-accent] px-2 py-0.5 text-xs text-[--color-foreground-muted]">
                    {po!.items.length} item{po!.items.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {po!.items && po!.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[--color-border] bg-[--color-background-subtle]">
                        <th className="px-6 py-2.5 text-left text-xs font-medium text-[--color-foreground-muted]">Description</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">Qty</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-[--color-foreground-muted]">Unit</th>
                        <th className="px-6 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">Unit Price</th>
                        <th className="px-6 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[--color-border]">
                      {po!.items.map((item, i) => (
                        <tr key={item.id ?? i} className="hover:bg-[--color-background-subtle] transition-colors">
                          <td className="px-6 py-3 text-[--color-foreground]">{item.description}</td>
                          <td className="px-4 py-3 text-right text-[--color-foreground]">{item.quantity}</td>
                          <td className="px-4 py-3 text-[--color-foreground-muted]">{item.unit ?? '—'}</td>
                          <td className="px-6 py-3 text-right text-[--color-foreground]">{formatCurrency(item.unit_price)}</td>
                          <td className="px-6 py-3 text-right font-medium text-[--color-foreground]">
                            {item.total_price != null
                              ? formatCurrency(item.total_price)
                              : formatCurrency(item.quantity * item.unit_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {po!.total_amount != null && (
                      <tfoot>
                        <tr className="border-t-2 border-[--color-border] bg-[--color-background-subtle]">
                          <td colSpan={4} className="px-6 py-3 text-right text-xs font-semibold text-[--color-foreground-muted]">Order Total</td>
                          <td className="px-6 py-3 text-right text-sm font-bold text-[--color-foreground]">{formatCurrency(po!.total_amount)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="mb-2 h-7 w-7 text-[--color-foreground-subtle]" />
                  <p className="text-sm text-[--color-foreground-muted]">No line items added</p>
                </div>
              )}
            </div>

            {/* Addresses */}
            {(po!.shipping_address || po!.billing_address) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {po!.shipping_address && (
                  <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
                    <div className="mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[--color-foreground-muted]" />
                      <h3 className="text-xs font-semibold text-[--color-foreground]">Shipping Address</h3>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted]">{po!.shipping_address}</p>
                  </div>
                )}
                {po!.billing_address && (
                  <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[--color-foreground-muted]" />
                      <h3 className="text-xs font-semibold text-[--color-foreground]">Billing Address</h3>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted]">{po!.billing_address}</p>
                  </div>
                )}
              </div>
            )}

            {po!.notes && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
                <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Notes</h2>
                <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted] leading-relaxed">{po!.notes}</p>
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">Status</h3>
              <POStatusBadge status={po!.status} />
            </div>
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">Details</h3>
              <Separator className="mb-3" />
              <div className="divide-y divide-[--color-border]">
                {po!.vendor && <InfoRow icon={Building2} label="Vendor" value={po!.vendor.name} />}
                {po!.total_amount != null && (
                  <InfoRow icon={DollarSign} label="Total Amount" value={<span className="text-[--color-primary]">{formatCurrency(po!.total_amount)}</span>} />
                )}
                {po!.payment_terms && <InfoRow icon={FileText} label="Payment Terms" value={po!.payment_terms} />}
                <InfoRow
                  icon={Calendar}
                  label="Delivery Date"
                  value={
                    po!.due_date ? (
                      <span className={isOverdue ? 'text-[--color-error]' : undefined}>
                        {formatDate(po!.due_date)}{isOverdue && ' · Overdue'}
                      </span>
                    ) : <span className="text-[--color-foreground-subtle]">Not set</span>
                  }
                />
                {createdAt && <InfoRow icon={Clock} label="Created" value={formatDate(po!.created_at)} />}
                {updatedAt && (
                  <InfoRow icon={Clock} label="Last updated" value={formatDistanceToNow(updatedAt, { addSuffix: true })} />
                )}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
