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
        background: 'linear-gradient(135deg, rgba(139,159,232,0.18) 0%, rgba(100,80,200,0.12) 50%, rgba(201,168,76,0.08) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(139,159,232,0.28)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(139,159,232,0.15)',
      }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139,159,232,0.15)' }} />
      <div className="absolute -bottom-8 -left-4 h-32 w-32 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(201,168,76,0.12)' }} />

      {/* Top reflection */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(139,159,232,0.4)] to-transparent pointer-events-none" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(139,159,232,0.8)' }}>
                {month}
              </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {getGreeting()}, {name} 👋
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm" style={{ color: '#D4DAEB' }}>
              Here&apos;s your workspace overview.
            </p>
            {role && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize"
                style={{
                  background: 'rgba(139,159,232,0.18)',
                  border: '1px solid rgba(139,159,232,0.38)',
                  color: '#A5B6F0',
                }}
              >
                {role}
              </span>
            )}
            {company && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.28)',
                  color: '#E8C86A',
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
            background: 'rgba(139,159,232,0.08)',
            border: '1px solid rgba(139,159,232,0.22)',
          }}
        >
          <p className="text-2xl font-bold text-white tracking-tight">{day.split(',')[1]?.trim()}</p>
          <p className="text-xs mt-0.5" style={{ color: '#8B9FE8' }}>{day.split(',')[0]}</p>
        </div>
      </div>
    </div>
  )
}
