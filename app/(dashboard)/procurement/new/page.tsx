import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { PRFormClient } from '@/components/procurement/pr-form-client'

export const metadata: Metadata = { title: 'New Purchase Request — VendorFlow' }

export default function NewPRPage() {
  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="New Purchase Request"
        description="Submit a request to purchase goods or services."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/procurement">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />
      <PageContainer className="max-w-4xl">
        <PRFormClient mode="create" />
      </PageContainer>
    </div>
  )
}
