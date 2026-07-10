import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getVendors } from '@/lib/supabase/vendors'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { VendorList } from '@/components/vendors/vendor-list'
import { TableSkeleton } from '@/components/shared/loading-states'
import type { VendorFilters, VendorStatus, VendorCategory } from '@/types/vendor'

export const metadata: Metadata = { title: 'Vendors — VendorFlow' }

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    category?: string
    page?: string
  }>
}

async function VendorListLoader({ filters }: { filters: VendorFilters }) {
  const companyId = await getCompanyId()
  const result = await getVendors(companyId, filters)

  return (
    <VendorList
      vendors={result.data}
      total={result.total}
      hasNextPage={result.hasNextPage}
      page={result.page}
    />
  )
}

export default async function VendorsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: VendorFilters = {
    search: params.search ?? '',
    status: (params.status as VendorStatus) ?? '',
    category: (params.category as VendorCategory) ?? '',
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  }

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Vendors"
        description="Manage your vendor relationships, contracts, and contact details."
      />
      <PageContainer>
        <Suspense fallback={<TableSkeleton rows={8} />}>
          <VendorListLoader filters={filters} />
        </Suspense>
      </PageContainer>
    </div>
  )
}
