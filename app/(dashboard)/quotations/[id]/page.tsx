import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Edit, Package, Building2, FileText,
  Calendar, Clock, Truck, ShieldCheck, Timer, CreditCard,
  GitCompare, FileDown, ShoppingCart,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { getQuotationById } from '@/lib/supabase/quotations'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { QuotationStatusBadge } from '@/components/quotations/quotation-status-badge'
import { QuotationDeleteButton } from '@/components/quotations/quotation-delete-button'
import { QuotationActionButtons } from '@/components/quotations/quotation-action-buttons'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatCurrency } from '@/lib/utils'
import { canCreatePO } from '@/config/nav-roles'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const companyId = await getCompanyId()
  const quotation = await getQuotationById(id, companyId)
  return {
    title: quotation
      ? `${quotation.quotation_number} — VendorFlow`
      : 'Quotation Not Found — VendorFlow',
  }
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

export default async function QuotationDetailPage({
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
    return null
  }

  let quotation: Awaited<ReturnType<typeof getQuotationById>>
  try {
    quotation = await getQuotationById(id, companyId!)
  } catch {
    notFound()
    return null
  }
  if (!quotation) notFound()

  const canEdit = quotation!.status === 'draft' || quotation!.status === 'under_review'
  const showCreatePO = quotation!.status === 'approved' && canCreatePO(role!)

  const createdAt = quotation!.created_at ? new Date(quotation!.created_at) : null
  const updatedAt = quotation!.updated_at ? new Date(quotation!.updated_at) : null

  // Fallback: compute totals from items when DB values are 0 (trigger may have been blocked by RLS)
  const items = quotation!.items ?? []
  const computedSubtotal = items.reduce((s, i) => s + (i.quantity * i.unit_price - (i.discount_amount ?? 0)), 0)
  const computedTax      = items.reduce((s, i) => s + (i.tax_amount ?? 0), 0)
  const discAmt          = (quotation!.discount_amount ?? 0)
  const computedGrand    = Math.max(0, computedSubtotal - discAmt + computedTax)

  const displaySubtotal = (quotation!.subtotal > 0) ? quotation!.subtotal : computedSubtotal
  const displayTax      = (quotation!.tax_amount > 0) ? quotation!.tax_amount : computedTax
  const displayDiscount = discAmt
  const displayGrand    = (quotation!.grand_total > 0) ? quotation!.grand_total : computedGrand

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={quotation!.quotation_number}
        description={`Quotation · ${createdAt ? `Created ${formatDistanceToNow(createdAt, { addSuffix: true })}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/quotations"><ChevronLeft className="h-4 w-4" />Back</Link>
            </Button>
            {quotation!.rfq_id && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/quotations/compare?rfq_id=${quotation!.rfq_id}`}>
                  <GitCompare className="h-4 w-4" />Compare
                </Link>
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/quotations/${quotation!.id}/edit`}><Edit className="h-4 w-4" />Edit</Link>
              </Button>
            )}
            {showCreatePO && (
              <Button size="sm" asChild>
                <Link href={`/purchase-orders/new?quotation_id=${quotation!.id}`}>
                  <ShoppingCart className="h-4 w-4" />Create Purchase Order
                </Link>
              </Button>
            )}
            <QuotationDeleteButton quotationId={quotation!.id} />
          </div>
        }
      />

      <PageContainer className="max-w-5xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Left: main content ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Workflow Actions */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Actions
              </h3>
              <QuotationActionButtons quotationId={quotation!.id} status={quotation!.status} />
            </div>

            {/* Line Items */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
              <div className="flex items-center justify-between border-b border-[--color-border] px-6 py-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[--color-foreground-muted]" />
                  <h2 className="text-sm font-semibold text-[--color-foreground]">Line Items</h2>
                </div>
                {quotation!.items && quotation!.items.length > 0 && (
                  <span className="rounded-full bg-[--color-accent] px-2 py-0.5 text-xs text-[--color-foreground-muted]">
                    {quotation!.items.length} item{quotation!.items.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {quotation!.items && quotation!.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[--color-border] bg-[--color-background-subtle]">
                        {['Item', 'Qty', 'Unit', 'Unit Price', 'Disc', 'Tax', 'Line Total'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[--color-foreground-muted]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[--color-border]">
                      {quotation!.items.map((item, i) => (
                        <tr key={item.id ?? i} className="hover:bg-[--color-background-subtle] transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[--color-foreground]">{item.item_name}</p>
                            {item.part_number && (
                              <p className="text-xs text-[--color-foreground-muted]">PN: {item.part_number}</p>
                            )}
                            {item.remarks && (
                              <p className="mt-0.5 text-xs text-[--color-foreground-subtle] italic">{item.remarks}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                          <td className="px-4 py-3 text-[--color-foreground-muted]">{item.unit}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-green-600">
                            {item.discount_pct > 0 ? `${item.discount_pct}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-[--color-foreground-muted]">
                            {item.tax_pct > 0 ? `${item.tax_pct}%` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-[--color-foreground]">
                            {formatCurrency(item.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[--color-border] bg-[--color-background-subtle]">
                        <td colSpan={6} className="px-4 py-2.5 text-right text-xs font-medium text-[--color-foreground-muted]">Subtotal</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-[--color-foreground]">{formatCurrency(displaySubtotal)}</td>
                      </tr>
                      {displayDiscount > 0 && (
                        <tr className="bg-[--color-background-subtle]">
                          <td colSpan={6} className="px-4 py-2 text-right text-xs font-medium text-green-600">
                            Discount ({quotation!.discount_type === 'percentage' ? `${quotation!.discount_value}%` : 'fixed'})
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-green-600 font-semibold">
                            − {formatCurrency(displayDiscount)}
                          </td>
                        </tr>
                      )}
                      {displayTax > 0 && (
                        <tr className="bg-[--color-background-subtle]">
                          <td colSpan={6} className="px-4 py-2 text-right text-xs font-medium text-[--color-foreground-muted]">Tax</td>
                          <td className="px-4 py-2 text-right tabular-nums text-[--color-foreground-muted]">+ {formatCurrency(displayTax)}</td>
                        </tr>
                      )}
                      <tr className="border-t-2 border-[--color-border] bg-[--color-background-subtle]">
                        <td colSpan={6} className="px-4 py-3 text-right text-sm font-bold text-[--color-foreground]">Grand Total</td>
                        <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-[--color-primary]">
                          {formatCurrency(displayGrand)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="mb-2 h-7 w-7 text-[--color-foreground-subtle]" />
                  <p className="text-sm text-[--color-foreground-muted]">No line items</p>
                </div>
              )}
            </div>

            {/* Documents */}
            {quotation!.documents && quotation!.documents.length > 0 && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]">
                <div className="border-b border-[--color-border] px-6 py-4">
                  <h2 className="text-sm font-semibold text-[--color-foreground]">Documents</h2>
                </div>
                <ul className="divide-y divide-[--color-border]">
                  {quotation!.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-[--color-foreground-muted]" />
                        <div>
                          <p className="text-sm font-medium text-[--color-foreground]">{doc.file_name}</p>
                          {doc.file_size && (
                            <p className="text-xs text-[--color-foreground-muted]">
                              {(doc.file_size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <FileDown className="h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quotation!.notes && (
              <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
                <h2 className="mb-2 text-sm font-semibold text-[--color-foreground]">Notes</h2>
                <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted] leading-relaxed">
                  {quotation!.notes}
                </p>
              </div>
            )}

            {quotation!.rejection_reason && (
              <div className="rounded-xl border border-[--color-error]/30 bg-[--color-error-bg] p-5">
                <p className="text-xs font-semibold text-[--color-error] mb-1">Rejection Reason</p>
                <p className="text-sm text-[--color-foreground-muted]">{quotation!.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* ── Right: sidebar ── */}
          <div className="space-y-4">

            {/* Status */}
            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">
                Status
              </h3>
              <QuotationStatusBadge status={quotation!.status} />
            </div>

            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">Details</h3>
              <Separator className="mb-3" />
              <div className="divide-y divide-[--color-border]">
                {quotation!.vendor && (
                  <InfoRow icon={Building2} label="Vendor" value={quotation!.vendor.name} />
                )}
                {quotation!.rfq && (
                  <InfoRow
                    icon={FileText}
                    label="RFQ"
                    value={
                      <Link href={`/rfqs/${quotation!.rfq.id}`} className="hover:text-[--color-primary] transition-colors">
                        {quotation!.rfq.title}
                      </Link>
                    }
                  />
                )}
                {quotation!.validity_date && (
                  <InfoRow icon={Calendar} label="Valid Until" value={formatDate(quotation!.validity_date)} />
                )}
                {quotation!.delivery_days != null && (
                  <InfoRow icon={Truck} label="Delivery" value={`${quotation!.delivery_days} days`} />
                )}
                {quotation!.lead_time_days != null && (
                  <InfoRow icon={Timer} label="Lead Time" value={`${quotation!.lead_time_days} days`} />
                )}
                {quotation!.warranty_months != null && (
                  <InfoRow icon={ShieldCheck} label="Warranty" value={`${quotation!.warranty_months} months`} />
                )}
                {quotation!.payment_terms && (
                  <InfoRow icon={CreditCard} label="Payment Terms" value={quotation!.payment_terms} />
                )}
                {createdAt && (
                  <InfoRow icon={Clock} label="Created" value={formatDate(quotation!.created_at)} />
                )}
                {updatedAt && (
                  <InfoRow icon={Clock} label="Last Updated" value={formatDistanceToNow(updatedAt, { addSuffix: true })} />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[--color-foreground-muted]">Financial Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[--color-foreground-muted]">Subtotal</span>
                  <span className="tabular-nums font-medium">{formatCurrency(displaySubtotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="tabular-nums">− {formatCurrency(displayDiscount)}</span>
                </div>
                <div className="flex justify-between text-[--color-foreground-muted]">
                  <span>Tax</span>
                  <span className="tabular-nums">+ {formatCurrency(displayTax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-[--color-primary]">
                  <span>Grand Total</span>
                  <span className="tabular-nums">{formatCurrency(displayGrand)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
