import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Clock } from 'lucide-react'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import { getPendingApprovals } from '@/lib/supabase/approvals'
import { ApprovalList } from '@/components/approvals/approval-list'
import { PageContainer } from '@/components/shared/page-container'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { Skeleton } from '@/components/shared/loading-states'
import { Button } from '@/components/ui/button'
import type { ApprovalEntityType } from '@/types/approval'

export const metadata: Metadata = { title: 'Pending Approvals — VendorFlow' }

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-56" />
            <Skeleton className="h-2.5 w-36" />
          </div>
          <Skeleton className="h-5 w-28 rounded-full hidden sm:block" />
        </div>
      ))}
    </div>
  )
}

interface PageProps {
  searchParams: Promise<{ search?: string; entity_type?: string; page?: string }>
}

async function PendingListServer({
  companyId,
  userId,
  search,
  entityType,
  page,
}: {
  companyId: string
  userId: string
  search: string
  entityType: string
  page: number
}) {
  const result = await getPendingApprovals(companyId, userId, {
    search: search || undefined,
    entity_type: (entityType as ApprovalEntityType) || undefined,
    page,
    pageSize: 20,
  })

  return (
    <ApprovalList
      requests={result.data}
      total={result.total}
      hasNextPage={result.hasNextPage}
      page={result.page}
      basePath="/approvals/pending"
      emptyTitle="No pending approvals"
      emptyDescription="You have no approval requests waiting for your action."
    />
  )
}

export default async function PendingApprovalsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search ?? ''
  const entityType = params.entity_type ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const companyId = await getCompanyId()
  const user = await getUser()

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Pending Approvals"
        description="Requests waiting for your decision"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/approvals"><ChevronLeft className="h-4 w-4" />All Approvals</Link>
          </Button>
        }
      />
      <PageContainer>
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-600">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Items awaiting your action</span>
        </div>
        <Suspense fallback={<ListSkeleton />}>
          <PendingListServer
            companyId={companyId}
            userId={user.id}
            search={search}
            entityType={entityType}
            page={page}
          />
        </Suspense>
      </PageContainer>
    </div>
  )
}
