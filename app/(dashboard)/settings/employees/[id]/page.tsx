import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { getEmployeeById, getRoles } from '@/lib/supabase/roles'
import { EditEmployeeForm } from '@/components/settings/edit-employee-form'

export const metadata: Metadata = { title: 'Edit Employee' }

interface PageProps { params: Promise<{ id: string }> }

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()
  const [employee, roles] = await Promise.all([
    getEmployeeById(id, companyId),
    getRoles(companyId),
  ])
  if (!employee) notFound()

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div>
        <Link
          href="/settings/employees"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Employees
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[--color-foreground]">
              {employee.full_name ?? employee.email ?? 'Employee'}
            </h1>
            <p className="text-xs text-[--color-foreground-muted]">{employee.email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]">
        <EditEmployeeForm employee={employee} roles={roles} />
      </div>
    </div>
  )
}
