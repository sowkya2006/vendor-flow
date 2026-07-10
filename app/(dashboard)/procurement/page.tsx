import type { Metadata } from 'next'
import { ShoppingCart } from 'lucide-react'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Procurement' }

export default function ProcurementPage() {
  return (
    <>
      <WorkspaceHeader
        title="Procurement"
        description="Manage your procurement workflows end-to-end."
        actions={<Button>New Request</Button>}
      />
      <PageContainer>
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="No procurement requests"
          description="Create your first procurement request to get started."
          action={<Button>Create request</Button>}
        />
      </PageContainer>
    </>
  )
}
