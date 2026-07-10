import type { Metadata } from 'next'
import { CommunicationCenter } from '@/components/communication/communication-center'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getVendors } from '@/lib/supabase/vendors'

export const metadata: Metadata = { title: 'Communication Center — VendorFlow' }

export default async function CommunicationPage() {
  const companyId = await getCompanyId()
  const { data: vendors } = await getVendors(companyId, { status: 'active', pageSize: 200 })

  return <CommunicationCenter vendors={vendors} />
}
