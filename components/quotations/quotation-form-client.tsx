'use client'

import { QuotationForm } from './quotation-form'
import type { Quotation } from '@/types/quotation'
import type { VendorSummary } from '@/types/vendor'
import type { RFQSummary } from '@/types/rfq'
import type { QuotationFormValues } from '@/lib/validations/quotation'

interface QuotationFormClientProps {
  quotation?: Quotation
  vendors: VendorSummary[]
  rfqs: RFQSummary[]
  onSubmit: (values: QuotationFormValues) => Promise<void>
  mode: 'create' | 'edit'
  defaultRfqId?: string
}

export function QuotationFormClient(props: QuotationFormClientProps) {
  return <QuotationForm {...props} />
}
