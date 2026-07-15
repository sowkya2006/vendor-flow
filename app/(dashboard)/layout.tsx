import { AppShell } from '@/components/layout/app-shell'
import { AuthSync } from '@/components/auth/auth-sync'
import { createClient } from '@/lib/supabase/server'
import { getPreviewRole } from '@/app/actions/role-preview'

export interface PreviewEmployee {
  id: string
  full_name: string
  email: string
  role: string
  department: string | null
  designation: string | null
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let realRole = 'viewer'
  let workspaceName = 'VendorFlow'
  let companyId: string | null = null
  let previewEmployee: PreviewEmployee | null = null

  // ── Step 1: Load user + company data ──────────────────────────────────────
  // Each await is independently try/caught so one failure never crashes layout.
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // No session — proxy will redirect; return shell to avoid layout crash
      const effectiveRole = 'viewer'
      return (
        <AppShell
          initialRole={effectiveRole}
          realRole={effectiveRole}
          previewRole={null}
          previewEmployee={null}
          workspaceName={workspaceName}
        >
          <AuthSync />
          {children}
        </AppShell>
      )
    }

    // User row — wrapped independently
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userRow } = await (supabase as any)
        .from('users')
        .select('role, company_id, companies(name, workspace_name)')
        .eq('id', user.id)
        .maybeSingle()

      if (userRow) {
        const row = userRow as {
          role: string
          company_id: string
          companies: { name: string; workspace_name: string | null } | null
        }
        realRole = row.role ?? 'viewer'
        companyId = row.company_id ?? null

        if (row.companies) {
          const co = row.companies
          workspaceName =
            co.workspace_name ??
            (co.name && !co.name.includes('@') ? co.name : 'My Workspace')
        }
      }
    } catch {
      // User row failed — use defaults, don't crash layout
    }
  } catch {
    // Auth client failed — use defaults
  }

  // ── Step 2: Check preview role (admin only) ────────────────────────────────
  let previewRole: string | null = null
  if (realRole === 'administrator' || realRole === 'admin') {
    try {
      previewRole = await getPreviewRole()
    } catch {
      // Non-critical — preview just won't be active
    }
  }

  // ── Step 3: Fetch preview employee only when needed ────────────────────────
  if (previewRole && companyId) {
    try {
      const supabase = await createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('users')
        .select('id, full_name, email, role, department, designation')
        .eq('company_id', companyId)
        .eq('role', previewRole)
        .eq('status', 'active')
        .neq('role', 'administrator')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (data) {
        const emp = data as {
          id: string; full_name: string | null; email: string
          role: string; department: string | null; designation: string | null
        }
        previewEmployee = {
          id: emp.id,
          full_name: emp.full_name ?? emp.email,
          email: emp.email,
          role: emp.role,
          department: emp.department,
          designation: emp.designation,
        }
      }
    } catch { /* non-critical */ }
  }

  const effectiveRole = previewRole ?? realRole

  return (
    <AppShell
      initialRole={effectiveRole}
      realRole={realRole}
      previewRole={previewRole ?? null}
      previewEmployee={previewEmployee}
      workspaceName={workspaceName}
    >
      <AuthSync />
      {children}
    </AppShell>
  )
}
