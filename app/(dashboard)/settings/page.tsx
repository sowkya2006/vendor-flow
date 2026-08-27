import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveProfile, getUserRole } from '@/lib/supabase/get-auth'
import { WorkspaceHeader } from '@/components/layout/workspace-header'
import { PageContainer } from '@/components/shared/page-container'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import type { TabId } from '@/components/settings/settings-tabs'

export const metadata: Metadata = { title: 'Settings — VendorFlow' }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/company/login')

  // Use preview-aware profile — shows the previewed employee's profile in preview mode
  let effectiveProfile
  try {
    effectiveProfile = await getEffectiveProfile()
  } catch {
    redirect('/company/login')
  }

  const role = await getUserRole()
  const isAdmin = role === 'administrator' || role === 'admin'

  // Fetch notification preferences — wrapped in try/catch because the
  // notification_preferences table may not exist in all environments yet.
  // If it's missing the settings page still loads; prefs just default to null.
  let notifPrefs: Record<string, boolean> | null = null
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', effectiveProfile.id)
      .maybeSingle()
    // Ignore "relation does not exist" (42P01) — table not yet migrated
    if (!error || error.code === '42P01' || error.message?.includes('does not exist')) {
      notifPrefs = (data as Record<string, boolean> | null) ?? null
    }
  } catch {
    // Non-critical — page renders fine without saved prefs
  }

  // Fetch company info + optional company_settings (currency, fiscal_year_start)
  let company: { name: string | null; timezone: string | null; workspace_name: string | null } | null = null
  let companySettings: { currency?: string; fiscal_year_start?: number } | null = null

  if (effectiveProfile.company_id) {
    try {
      const { data } = await supabase
        .from('companies')
        .select('name, timezone, workspace_name')
        .eq('id', effectiveProfile.company_id)
        .maybeSingle()
      company = (data as typeof company) ?? null
    } catch {
      // Non-critical — org tab will just be empty
    }

    try {
      const { data } = await supabase
        .from('company_settings')
        .select('currency, fiscal_year_start')
        .eq('company_id', effectiveProfile.company_id)
        .maybeSingle()
      companySettings = (data as typeof companySettings) ?? null
    } catch {
      // company_settings table may not exist yet — silently ignore
    }
  }

  const resolvedParams = await searchParams
  const activeTab = (resolvedParams?.tab as TabId | undefined) ?? 'profile'

  // Build org prop outside JSX to avoid TypeScript narrowing-to-never inside ternary
  type OrgProp = { name: string; timezone?: string; currency?: string; fiscal_year_start?: number }
  const orgProp: OrgProp | undefined = company
    ? {
        name:              (company as { name: string | null }).name ?? '',
        timezone:          (company as { timezone: string | null }).timezone ?? undefined,
        currency:          (companySettings as { currency?: string } | null)?.currency,
        fiscal_year_start: (companySettings as { fiscal_year_start?: number } | null)?.fiscal_year_start,
      }
    : undefined

  return (
    <div className="min-h-full">
      <WorkspaceHeader
        title="Settings"
        description={effectiveProfile.isPreview
          ? `Viewing as ${effectiveProfile.full_name ?? effectiveProfile.email ?? role}`
          : 'Manage your account and workspace preferences'
        }
        actions={<Settings className="h-5 w-5 text-[--color-foreground-muted]" />}
      />
      <PageContainer>
        <SettingsTabs
          activeTab={activeTab}
          isAdmin={isAdmin}
          profile={{
            full_name: effectiveProfile.full_name ?? '',
            email: effectiveProfile.email ?? user.email ?? '',
            role: effectiveProfile.role,
            created_at: user.created_at,
            department: effectiveProfile.department,
            designation: effectiveProfile.designation,
          }}
          notifPrefs={notifPrefs ?? undefined}
          org={orgProp}
        />
      </PageContainer>
    </div>
  )
}
