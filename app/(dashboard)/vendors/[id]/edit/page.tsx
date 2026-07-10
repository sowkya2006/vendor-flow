import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getVendorById } from '@/lib/supabase/vendors'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { VendorForm } from '@/components/vendors/vendor-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const companyId = await getCompanyId().catch(() => '')
  const vendor = companyId ? await getVendorById(id, companyId) : null
  return {
    title: vendor ? `Edit ${vendor.name} — VendorFlow` : 'Edit Vendor — VendorFlow',
  }
}

export default async function EditVendorPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()
  const vendor = await getVendorById(id, companyId)
  if (!vendor) notFound()

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title={`Edit ${vendor.name}`}
        description="Update this vendor's information below."
        actions={
          <Link
            href={`/vendors/${vendor.id}`}
            className="flex items-center gap-1 text-sm text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to vendor
          </Link>
        }
      />
      <PageContainer className="max-w-3xl">
        <VendorForm vendor={vendor} />
      </PageContainer>
    </div>
  )
}
