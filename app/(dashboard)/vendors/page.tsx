import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { getVendors } from '@/lib/supabase/vendors'
import { getIncomingCollaborationRequests } from '@/lib/supabase/vendor-registration'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { VendorList } from '@/components/vendors/vendor-list'
import { TableSkeleton } from '@/components/shared/loading-states'
import type { VendorFilters, VendorStatus, VendorCategory } from '@/types/vendor'
import Link from 'next/link'
import { Bell } from 'lucide-react'

export const metadata: Metadata = { title: 'Vendors — VendorFlow' }

interface PageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    category?: string
    page?: string
  }>
}

async function VendorListLoader({ filters, canCreate }: { filters: VendorFilters; canCreate: boolean }) {
  const companyId = await getCompanyId()
  const result = await getVendors(companyId, filters)

  return (
    <VendorList
      vendors={result.data}
      total={result.total}
      hasNextPage={result.hasNextPage}
      page={result.page}
      canCreate={canCreate}
    />
  )
}

async function PendingRequestsBanner() {
  try {
    const companyId = await getCompanyId()
    const pending = await getIncomingCollaborationRequests(companyId, 'pending')
    if (pending.length === 0) return null

    return (
      <Link
        href="/vendors/requests"
        className="flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 mb-4 hover:bg-amber-500/15 transition-colors"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <Bell className="h-4 w-4 text-amber-400" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-300">
            {pending.length} pending vendor collaboration request{pending.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-amber-400/80 mt-0.5">
            Vendors are waiting to collaborate. Accept their requests to add them to your vendor list.
          </p>
        </div>
        <span className="text-xs font-medium text-amber-400 shrink-0">Review →</span>
      </Link>
    )
  } catch {
    return null
  }
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

  const role = await getUserRole()
  const canCreate = role === 'administrator' || role === 'admin'

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Vendors"
        description="Manage your vendor relationships, contracts, and contact details."
      />
      <PageContainer>
        {/* Pending requests banner */}
        <Suspense fallback={null}>
          <PendingRequestsBanner />
        </Suspense>

        <Suspense fallback={<TableSkeleton rows={8} />}>
          <VendorListLoader filters={filters} canCreate={canCreate} />
        </Suspense>
      </PageContainer>
    </div>
  )
}
