import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Building2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getUserRole } from '@/lib/supabase/get-auth'
import { WorkspaceSettingsForm } from '@/components/settings/workspace-settings-form'

export const metadata: Metadata = { title: 'Workspace — VendorFlow' }

export default async function WorkspaceSettingsPage() {
  const role = await getUserRole()
  const isAdmin = role === 'administrator' || role === 'admin'

  // All roles can VIEW workspace — only admin can EDIT
  // (Previously this was admin-only and redirected to /403 — now all roles can read)
  const companyId = await getCompanyId()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: company } = await (supabase as any)
    .from('companies')
    .select('id, name, workspace_name, industry, gst_number, phone, address, timezone')
    .eq('id', companyId)
    .single()

  if (!company) redirect('/workspace/setup')

  const c = company as {
    id: string
    name: string
    workspace_name: string | null
    industry: string | null
    gst_number: string | null
    phone: string | null
    address: string | null
    timezone: string | null
  }

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">Workspace</h1>
            <p className="text-xs text-[--color-foreground-muted]">
              {isAdmin ? 'Manage your company profile' : 'View your company profile'}
            </p>
          </div>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-1.5 rounded-lg border border-[--color-border] bg-[--color-background-subtle] px-3 py-1.5 text-xs text-[--color-foreground-muted]">
            <Lock className="h-3 w-3" />
            Read-only
          </div>
        )}
      </div>

      {isAdmin ? (
        /* Admin — editable form */
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[var(--shadow-sm)]">
          <WorkspaceSettingsForm
            defaultValues={{
              company_name: c.name,
              workspace_name: c.workspace_name ?? '',
              industry: c.industry ?? '',
              gst_number: c.gst_number ?? '',
              phone: c.phone ?? '',
              address: c.address ?? '',
              timezone: c.timezone ?? 'Asia/Kolkata',
            }}
          />
        </div>
      ) : (
        /* Non-admin — read-only info cards */
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] divide-y divide-[--color-border] shadow-[var(--shadow-sm)]">
          {[
            { label: 'Company Name',    value: c.name },
            { label: 'Workspace Name',  value: c.workspace_name ?? '—' },
            { label: 'Industry',        value: c.industry ?? '—' },
            { label: 'GST Number',      value: c.gst_number ?? '—' },
            { label: 'Phone',           value: c.phone ?? '—' },
            { label: 'Address',         value: c.address ?? '—' },
            { label: 'Timezone',        value: c.timezone ?? 'Asia/Kolkata' },
            { label: 'Company ID',      value: c.id },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 px-5 py-3.5">
              <span className="text-sm font-medium text-[--color-foreground-muted] shrink-0 w-36">{label}</span>
              <span className="text-sm text-[--color-foreground] text-right break-all">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
