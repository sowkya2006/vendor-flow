import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { QuotationCompare } from '@/components/quotations/quotation-compare'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { compareQuotations, getQuotations } from '@/lib/supabase/quotations'
import { getRFQById } from '@/lib/supabase/rfqs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const metadata: Metadata = { title: 'Compare Quotations — VendorFlow' }

// ── RFQ picker (client) ───────────────────────────────────────────────────────

function RFQPicker({
  rfqId,
  rfqs,
}: {
  rfqId: string
  rfqs: { id: string; title: string }[]
}) {
  return (
    <form method="GET" action="/quotations/compare" className="flex items-center gap-2">
      <Select name="rfq_id" defaultValue={rfqId}>
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Select an RFQ to compare" />
        </SelectTrigger>
        <SelectContent>
          {rfqs.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" variant="outline" size="sm">
        Compare
      </Button>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ rfq_id?: string }>
}

export default async function CompareQuotationsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const rfqId = params.rfq_id ?? ''
  const companyId = await getCompanyId()

  // Load RFQ list for the picker
  const rfqsResult = await getQuotations(companyId, { pageSize: 200 })
  // Collect unique RFQs from quotations
  const rfqMap = new Map<string, { id: string; title: string }>()
  for (const q of rfqsResult.data) {
    if (q.rfq && q.rfq_id && !rfqMap.has(q.rfq_id)) {
      rfqMap.set(q.rfq_id, { id: q.rfq_id, title: q.rfq.title })
    }
  }
  const rfqOptions = Array.from(rfqMap.values())

  let quotations = rfqId ? await compareQuotations(rfqId, companyId) : []
  let rfqTitle: string | undefined

  if (rfqId) {
    const rfq = await getRFQById(rfqId, companyId)
    rfqTitle = rfq?.title
  }

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Compare Quotations"
        description="Side-by-side comparison of vendor quotations for an RFQ"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/quotations">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <PageContainer>
        <div className="space-y-6">
          {/* RFQ Picker */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
                <GitCompare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[--color-foreground]">
                  {rfqTitle ? `RFQ: ${rfqTitle}` : 'Select an RFQ'}
                </h2>
                <p className="text-xs text-[--color-foreground-muted]">
                  {quotations.length > 0
                    ? `${quotations.length} quotation${quotations.length !== 1 ? 's' : ''} available`
                    : 'Choose an RFQ to compare vendor quotations'}
                </p>
              </div>
            </div>

            {rfqOptions.length > 0 && (
              <RFQPicker rfqId={rfqId} rfqs={rfqOptions} />
            )}
          </div>

          {/* Comparison table */}
          <QuotationCompare quotations={quotations} rfqTitle={rfqTitle} />
        </div>
      </PageContainer>
    </div>
  )
}
