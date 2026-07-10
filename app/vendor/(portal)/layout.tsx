import { redirect } from 'next/navigation'
import { getVendorUser } from '@/lib/supabase/vendor-portal'
import { VendorPortalSidebar } from '@/components/vendor-portal/vendor-portal-sidebar'
import { VendorPortalHeader } from '@/components/vendor-portal/vendor-portal-header'

export default async function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  const vendorUser = await getVendorUser()
  if (!vendorUser) redirect('/vendor/login')

  return (
    <div className="flex h-screen overflow-hidden bg-[--color-background]">
      <VendorPortalSidebar vendorUser={vendorUser} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <VendorPortalHeader vendorUser={vendorUser} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
