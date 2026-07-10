import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getVendorUser, getVendorProfile } from '@/lib/supabase/vendor-portal'
import { VendorProfileForm } from '@/components/vendor-portal/vendor-profile-form'
import { User, Building2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Profile' }

export default async function VendorProfilePage() {
  const vu = await getVendorUser()
  if (!vu) redirect('/vendor/login')
  const profile = await getVendorProfile(vu.vendor_id)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Profile</h1>
          <p className="text-xs text-[--color-foreground-muted]">Manage your vendor profile and contact details</p>
        </div>
      </div>

      {/* Personal info */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[--color-foreground]">
          <User className="h-4 w-4" /> Your Account
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[--color-foreground-muted]">Name</span>
            <span className="font-medium text-[--color-foreground]">{vu.full_name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--color-foreground-muted]">Email</span>
            <span className="font-medium text-[--color-foreground]">{vu.email ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--color-foreground-muted]">Role</span>
            <span className="font-medium text-[--color-foreground] capitalize">{vu.role}</span>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[--color-foreground]">
          <Building2 className="h-4 w-4" /> Company Information
        </h2>
        {profile ? (
          <VendorProfileForm defaultValues={profile} />
        ) : (
          <p className="text-sm text-[--color-foreground-muted]">Profile not found.</p>
        )}
      </div>
    </div>
  )
}
