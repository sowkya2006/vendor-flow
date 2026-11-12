import { createClient } from '@/lib/supabase/server'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export async function GlassDashboardHeader() {
  let name = 'there'
  let role = ''
  let company = ''

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('users')
        .select('full_name, email, role, company_id, companies(name, workspace_name)')
        .eq('id', user.id)
        .single()
      const row = data as {
        full_name: string | null; email: string | null; role: string | null
        companies: { name: string; workspace_name: string | null } | null
      } | null
      if (row?.full_name) name = row.full_name.split(' ')[0]
      else if (row?.email) name = row.email.split('@')[0]
      if (row?.role) role = row.role.replace(/_/g, ' ')
      if (row?.companies) {
        company = row.companies.workspace_name ?? row.companies.name ?? ''
      }
    }
  } catch { /* not authenticated */ }

  const month = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date())
  const day   = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date())

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(107,143,138,0.10) 0%, #FFFFFF 60%, rgba(196,132,106,0.06) 100%)',
        border: '1px solid rgba(107,143,138,0.15)',
        boxShadow: '0 2px 12px rgba(107,143,138,0.08)',
      }}
    >
      {/* Soft blobs */}
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(107,143,138,0.12)' }} />
      <div className="absolute -bottom-8 -left-4 h-32 w-32 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(196,132,106,0.10)' }} />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#6B8F8A' }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#6B8F8A' }}>
              {month}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2D3748]">
            {getGreeting()}, {name} 👋
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm text-[#64748B]">
              Here&apos;s your workspace overview.
            </p>
            {role && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                style={{
                  background: 'rgba(107,143,138,0.12)',
                  border: '1px solid rgba(107,143,138,0.25)',
                  color: '#3D7A74',
                }}
              >
                {role}
              </span>
            )}
            {company && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: 'rgba(196,132,106,0.10)',
                  border: '1px solid rgba(196,132,106,0.22)',
                  color: '#A05A3A',
                }}
              >
                {company}
              </span>
            )}
          </div>
        </div>

        <div
          className="shrink-0 rounded-xl px-4 py-3 text-center"
          style={{
            background: 'rgba(107,143,138,0.08)',
            border: '1px solid rgba(107,143,138,0.18)',
          }}
        >
          <p className="text-2xl font-bold text-[#2D3748] tracking-tight">{day.split(',')[1]?.trim()}</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B8F8A' }}>{day.split(',')[0]}</p>
        </div>
      </div>
    </div>
  )
}
