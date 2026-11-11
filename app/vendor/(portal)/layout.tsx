import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VendorPortalSidebar } from '@/components/vendor-portal/vendor-portal-sidebar'
import { VendorPortalHeader } from '@/components/vendor-portal/vendor-portal-header'
import type { VendorUser } from '@/types/vendor-portal'

/**
 * Vendor portal layout.
 * Supports two vendor types:
 * 1. Invited vendor — has a vendor_users record (linked to a specific company's vendor)
 * 2. Self-registered vendor — has a vendor_companies record (registered independently)
 */
export default async function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/vendor/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Check invited vendor (vendor_users record)
  const { data: vendorUserRow } = await db
    .from('vendor_users')
    .select('*, vendor:vendors(*)')
    .eq('user_id', user.id)
    .maybeSingle()

  // Check self-registered vendor (vendor_companies record)
  const { data: vendorCompanyRow } = await db
    .from('vendor_companies')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Neither — redirect to register
  if (!vendorUserRow && !vendorCompanyRow) {
    redirect('/vendor/register')
  }

  // Build a VendorUser-compatible object for the sidebar
  // For self-registered vendors, create a synthetic VendorUser
  const vendorUser: VendorUser = vendorUserRow ?? {
    id: user.id,
    user_id: user.id,
    vendor_id: vendorCompanyRow?.id ?? '',
    company_id: '',
    role: 'admin' as const,
    full_name: vendorCompanyRow?.contact_name ?? user.email?.split('@')[0] ?? 'Vendor',
    email: user.email ?? vendorCompanyRow?.email ?? '',
    phone: vendorCompanyRow?.phone ?? null,
    avatar_url: null,
    is_primary: true,
    created_at: vendorCompanyRow?.created_at ?? new Date().toISOString(),
    updated_at: vendorCompanyRow?.updated_at ?? new Date().toISOString(),
    vendor: vendorUserRow?.vendor ?? {
      id: vendorCompanyRow?.id ?? '',
      company_id: '',
      name: vendorCompanyRow?.company_name ?? 'My Company',
      legal_name: null,
      email: vendorCompanyRow?.email ?? null,
      phone: vendorCompanyRow?.phone ?? null,
      website: vendorCompanyRow?.website ?? null,
      address: vendorCompanyRow?.address ?? null,
      category: vendorCompanyRow?.industry ?? null,
      status: 'active',
      tax_id: vendorCompanyRow?.gst_number ?? null,
      registration_number: null,
      description: vendorCompanyRow?.description ?? null,
      notes: null,
      currency: null,
      payment_terms: null,
      created_at: vendorCompanyRow?.created_at ?? new Date().toISOString(),
      updated_at: vendorCompanyRow?.updated_at ?? new Date().toISOString(),
    },
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[--color-background]">
      <VendorPortalSidebar vendorUser={vendorUser} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <VendorPortalHeader
          vendorUser={vendorUser}
          companyName={vendorCompanyRow?.company_name ?? vendorUserRow?.vendor?.name ?? null}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
