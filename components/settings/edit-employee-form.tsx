'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateEmployeeAction } from '@/app/(dashboard)/settings/actions'
import type { Employee, PortalRole } from '@/lib/supabase/roles'
import { ROLE_LABELS } from '@/config/nav-roles'

const schema = z.object({
  full_name: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  department: z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
})
type Values = z.infer<typeof schema>

const STATUSES = ['active', 'inactive', 'suspended'] as const

export function EditEmployeeForm({ employee, roles }: { employee: Employee; roles: PortalRole[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: employee.full_name ?? '',
      phone: employee.phone ?? '',
      department: employee.department ?? '',
      designation: employee.designation ?? '',
      role: employee.role,
      status: (employee.status as 'active' | 'inactive' | 'suspended') ?? 'active',
    },
  })

  function onSubmit(values: Values) {
    setError(null)
    startTransition(async () => {
      try {
        await updateEmployeeAction({ id: employee.id, ...values })
        toast.success('Employee updated')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Update failed')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ee-name">Full Name</Label>
          <Input id="ee-name" {...register('full_name')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ee-phone">Phone</Label>
          <Input id="ee-phone" {...register('phone')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ee-dept">Department</Label>
          <Input id="ee-dept" {...register('department')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ee-desig">Designation</Label>
          <Input id="ee-desig" {...register('designation')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select defaultValue={employee.role} onValueChange={(v) => setValue('role', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.slug} value={r.slug}>{r.name}</SelectItem>
              ))}
              {roles.length === 0 && Object.entries(ROLE_LABELS).map(([slug, label]) => (
                <SelectItem key={slug} value={slug}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            defaultValue={employee.status ?? 'active'}
            onValueChange={(v) => setValue('status', v as 'active' | 'inactive' | 'suspended')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
