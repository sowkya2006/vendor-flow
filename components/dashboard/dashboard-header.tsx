import React from 'react'
import { CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDisplayDate() {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

export async function DashboardHeader() {
  let displayName = 'there'
  let role = ''

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('users')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single()
      const row = data as { full_name: string | null; email: string | null; role: string | null } | null
      if (row?.full_name) displayName = row.full_name.split(' ')[0]
      else if (row?.email) displayName = row.email.split('@')[0]
      else if (user.email) displayName = user.email.split('@')[0]
      if (row?.role) role = row.role.replace(/_/g, ' ')
    }
  } catch { /* not authenticated */ }

  return (
    <div className="border-b border-[--color-border] bg-[--color-background]">
      <div className="mx-auto max-w-screen-2xl px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[--color-foreground]">
              {getGreeting()}, {displayName} 👋
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-[--color-foreground-muted]">
                Here&apos;s what&apos;s happening in your workspace.
              </p>
              {role && (
                <span className="rounded-full bg-[--color-primary]/10 px-2 py-0.5 text-[10px] font-semibold text-[--color-primary] capitalize">
                  {role}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-[--color-border] bg-[--color-background-subtle] px-3 py-2">
            <CalendarDays className="h-3.5 w-3.5 text-[--color-foreground-muted]" />
            <span className="text-xs font-medium text-[--color-foreground-muted]">
              {formatDisplayDate()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
