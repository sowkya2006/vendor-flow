import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CommunicationCenter } from '@/components/communication/communication-center'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getVendors } from '@/lib/supabase/vendors'

export const metadata: Metadata = { title: 'Communication Center — VendorFlow' }

// Separate async component so Suspense boundary (and the route's loading.tsx)
// can kick in while vendor data loads, and error.tsx can catch fetch failures.
async function CommunicationLoader() {
  const companyId = await getCompanyId()
  const { data: vendors } = await getVendors(companyId, { status: 'active', pageSize: 200 })
  return <CommunicationCenter vendors={vendors} />
}

export default function CommunicationPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-primary] border-t-transparent" />
      </div>
    }>
      <CommunicationLoader />
    </Suspense>
  )
}
