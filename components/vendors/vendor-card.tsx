import Link from 'next/link'
import { Building2, Globe, Mail, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { VendorStatusBadge } from './vendor-status-badge'
import { VENDOR_CATEGORY_LABELS } from '@/types/vendor'
import type { VendorSummary } from '@/types/vendor'

interface VendorCardProps {
  vendor: VendorSummary
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
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(dateStr))
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link href={`/vendors/${vendor.id}`} className="block h-full">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-[--color-foreground-muted]" />
              <h3 className="truncate text-sm font-semibold text-[--color-foreground]">
                {vendor.name}
              </h3>
            </div>
            <VendorStatusBadge status={vendor.status} />
          </div>
          <p className="pl-6 text-xs capitalize text-[--color-foreground-muted]">
            {VENDOR_CATEGORY_LABELS[vendor.category] ?? vendor.category}
          </p>
        </CardHeader>

        <CardContent className="space-y-2 text-xs text-[--color-foreground-muted]">
          {vendor.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{vendor.email}</span>
            </div>
          )}
          {vendor.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{vendor.website}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[--color-border] pt-2">
            <div className="flex items-center gap-1 font-medium text-[--color-foreground]">
              <DollarSign className="h-3 w-3" />
              <span>{formatCurrency(vendor.contract_value)}/yr</span>
            </div>
            {vendor.contract_end_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Expires {formatDate(vendor.contract_end_date)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
