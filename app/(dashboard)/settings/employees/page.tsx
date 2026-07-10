import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Users, UserPlus, Mail } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getEmployees, getInvitations, getRoles } from '@/lib/supabase/roles'
import { Skeleton } from '@/components/shared/loading-states'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { InviteEmployeeButton } from '@/components/settings/invite-employee-button'
import { ROLE_LABELS } from '@/config/nav-roles'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Employees' }

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  invited: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

async function EmployeeList() {
  const companyId = await getCompanyId()
  const [employees, invitations, roles] = await Promise.all([
    getEmployees(companyId),
    getInvitations(companyId),
    getRoles(companyId),
  ])

  const pendingInvites = invitations.filter((i) => !i.accepted_at && new Date(i.expires_at) > new Date())

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Employees', value: employees.length },
          { label: 'Active', value: employees.filter((e) => e.status === 'active').length },
          { label: 'Pending Invites', value: pendingInvites.length },
          { label: 'Roles', value: roles.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[--color-border] bg-[--color-card] px-5 py-4 shadow-[--shadow-sm]">
            <p className="text-xs font-medium text-[--color-foreground-muted]">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-[--color-foreground]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Employees table */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
        <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
          <h2 className="text-sm font-semibold text-[--color-foreground]">Team Members</h2>
          <InviteEmployeeButton roles={roles} />
        </div>

        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-10 w-10 text-[--color-foreground-subtle] mb-3" />
            <p className="text-sm font-medium text-[--color-foreground]">No employees yet</p>
            <p className="text-xs text-[--color-foreground-muted] mt-1">Invite team members to collaborate on procurement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-[--color-background-subtle]">
                <tr>
                  {['Name', 'Email', 'Role', 'Department', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[--color-foreground-muted]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-border]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[--color-background-subtle] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[--color-primary]/10 text-[10px] font-bold text-[--color-primary]">
                          {(emp.full_name ?? emp.email ?? '?')[0].toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-[--color-foreground]">{emp.full_name ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[--color-foreground-muted]">{emp.email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-[--color-foreground-muted]">{ROLE_LABELS[emp.role] ?? emp.role}</td>
                    <td className="px-4 py-3 text-sm text-[--color-foreground-muted]">{emp.department ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLE[emp.status] ?? STATUS_STYLE.inactive)}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/settings/employees/${emp.id}`} className="text-xs text-[--color-primary] hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div className="rounded-xl border border-[--color-border] bg-[--color-card] overflow-hidden shadow-[--shadow-sm]">
          <div className="flex items-center gap-2 border-b border-[--color-border] px-5 py-4">
            <Mail className="h-4 w-4 text-[--color-foreground-muted]" />
            <h2 className="text-sm font-semibold text-[--color-foreground]">Pending Invitations</h2>
          </div>
          <div className="divide-y divide-[--color-border]">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-[--color-foreground]">{inv.full_name ?? inv.email}</p>
                  <p className="text-xs text-[--color-foreground-muted]">{inv.email} · {ROLE_LABELS[inv.role_slug] ?? inv.role_slug}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">Pending</span>
                  <p className="text-xs text-[--color-foreground-muted] mt-0.5">Expires {formatDate(inv.expires_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[--color-foreground]">Employees</h1>
          <p className="text-xs text-[--color-foreground-muted]">Manage team members and access</p>
        </div>
      </div>
      <Suspense fallback={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>}>
        <EmployeeList />
      </Suspense>
    </div>
  )
}
