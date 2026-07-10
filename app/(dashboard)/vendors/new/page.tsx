import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { VendorForm } from '@/components/vendors/vendor-form'

export const metadata: Metadata = { title: 'New Vendor — VendorFlow' }

export default function NewVendorPage() {
  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="New vendor"
        description="Fill in the details below to add a new vendor to your workspace."
        actions={
          <Link
            href="/vendors"
            className="flex items-center gap-1 text-sm text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to vendors
          </Link>
        }
      />
      <PageContainer className="max-w-3xl">
        <VendorForm />
      </PageContainer>
    </div>
  )
}
