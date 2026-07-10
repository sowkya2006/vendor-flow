import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Pencil,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getVendorById } from '@/lib/supabase/vendors'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { VendorStatusBadge } from '@/components/vendors/vendor-status-badge'
import { DeleteVendorButton } from '@/components/vendors/delete-vendor-button'
import { VENDOR_CATEGORY_LABELS } from '@/types/vendor'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const companyId = await getCompanyId().catch(() => '')
  const vendor = companyId ? await getVendorById(id, companyId) : null
  return { title: vendor ? `${vendor.name} — VendorFlow` : 'Vendor — VendorFlow' }
}

function formatCurrency(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(dateStr))
}

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  href?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[--color-muted] text-[--color-foreground-muted]">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[--color-foreground-muted]">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 truncate text-sm font-medium text-[--color-primary] hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="mt-0.5 text-sm font-medium text-[--color-foreground]">{value ?? '—'}</p>
        )}
      </div>
    </div>
  )
}

export default async function VendorDetailPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()
  const vendor = await getVendorById(id, companyId)
  if (!vendor) notFound()

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={vendor.name}
        description={VENDOR_CATEGORY_LABELS[vendor.category] ?? vendor.category}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/vendors"
              className="flex items-center gap-1 text-sm text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              All vendors
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Button asChild variant="outline" size="sm">
              <Link href={`/vendors/${vendor.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
            <DeleteVendorButton id={vendor.id} name={vendor.name} />
          </div>
        }
      />

      <PageContainer>
        <div className="grid gap-5 lg:grid-cols-3">
          {/* ── Main column ──────────────────────────────────────── */}
          <div className="space-y-5 lg:col-span-2">
            {/* Contact details */}
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-sm font-semibold text-[--color-foreground]">
                  Contact details
                </h2>
              </CardHeader>
              <CardContent className="divide-y divide-[--color-border]">
                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={vendor.email ?? '—'}
                  href={vendor.email ? `mailto:${vendor.email}` : undefined}
                />
                <DetailRow icon={Phone} label="Phone" value={vendor.phone} />
                <DetailRow
                  icon={Globe}
                  label="Website"
                  value={vendor.website ?? '—'}
                  href={vendor.website ?? undefined}
                />
                <DetailRow icon={MapPin} label="Address" value={vendor.address} />
              </CardContent>
            </Card>

            {/* Notes */}
            {vendor.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[--color-foreground]">
                    <FileText className="h-4 w-4 text-[--color-foreground-muted]" />
                    Notes
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-[--color-foreground-muted]">
                    {vendor.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Sidebar column ───────────────────────────────────── */}
          <div className="space-y-5">
            {/* Status & meta */}
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-sm font-semibold text-[--color-foreground]">Overview</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[--color-foreground-muted]">Status</span>
                  <VendorStatusBadge status={vendor.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[--color-foreground-muted]">Category</span>
                  <span className="text-sm font-medium text-[--color-foreground] capitalize">
                    {VENDOR_CATEGORY_LABELS[vendor.category] ?? vendor.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[--color-foreground-muted]">Added</span>
                  <span className="text-sm text-[--color-foreground-muted]">
                    {formatDate(vendor.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contract & financials */}
            <Card>
              <CardHeader className="pb-2">
                <h2 className="text-sm font-semibold text-[--color-foreground]">
                  Contract &amp; financials
                </h2>
              </CardHeader>
              <CardContent className="divide-y divide-[--color-border]">
                <DetailRow
                  icon={DollarSign}
                  label="Annual value"
                  value={formatCurrency(vendor.contract_value)}
                />
                <DetailRow
                  icon={Calendar}
                  label="Contract start"
                  value={formatDate(vendor.contract_start_date)}
                />
                <DetailRow
                  icon={Calendar}
                  label="Contract end"
                  value={formatDate(vendor.contract_end_date)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
