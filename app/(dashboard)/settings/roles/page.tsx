import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { ShieldCheck, Plus } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { getRoles, getAllPermissions } from '@/lib/supabase/roles'
import { RolePermissionsForm } from '@/components/settings/role-permissions-form'
import { CreateRoleButton } from '@/components/settings/create-role-button'
import { Skeleton } from '@/components/shared/loading-states'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Roles & Permissions' }

async function RolesContent() {
  const companyId = await getCompanyId()
  const [roles, allPermissions] = await Promise.all([
    getRoles(companyId),
    getAllPermissions(),
  ])

  return (
    <div className="space-y-6">
      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <div key={role.id} className="rounded-xl border border-[--color-border] bg-[--color-card] p-4 shadow-[--shadow-sm]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[--color-foreground] truncate">{role.name}</p>
                <p className="text-xs text-[--color-foreground-muted] mt-0.5 truncate">{role.description ?? 'No description'}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {role.is_system && (
                  <span className="rounded-full bg-[--color-primary]/10 px-2 py-0.5 text-[10px] font-semibold text-[--color-primary]">
                    System
                  </span>
                )}
                <span className="text-xs text-[--color-foreground-muted]">
                  {(role.permissions ?? []).length} perms
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-role permission editor */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[--color-foreground]">Configure Role Permissions</h2>
        <div className="space-y-3">
          {roles.map((role) => (
            <details key={role.id} className="group rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 select-none hover:bg-[--color-background-subtle] transition-colors list-none">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[--color-foreground-muted] shrink-0" />
                  <span className="text-sm font-medium text-[--color-foreground]">{role.name}</span>
                  {role.is_system && (
                    <span className="rounded-full bg-[--color-primary]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[--color-primary]">
                      System
                    </span>
                  )}
                </div>
                <span className="text-xs text-[--color-foreground-muted] shrink-0">
                  {(role.permissions ?? []).length} / {allPermissions.length} permissions
                </span>
              </summary>
              <div className="border-t border-[--color-border] px-5 py-4">
                <RolePermissionsForm role={role} allPermissions={allPermissions} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function RolesPage() {
  // Administrator-only page
  const role = await getUserRole()
  const isAdmin = role === 'administrator' || role === 'admin'
  if (!isAdmin) redirect('/403')
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Roles & Permissions</h1>
            <p className="text-xs text-[--color-foreground-muted]">Configure what each role can access</p>
          </div>
        </div>
        <CreateRoleButton />
      </div>
      <Suspense fallback={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}>
        <RolesContent />
      </Suspense>
    </div>
  )
}
