'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { inviteEmployeeAction } from '@/app/(dashboard)/settings/actions'
import type { PortalRole } from '@/lib/supabase/roles'

const schema = z.object({
  email: z.string().email('Valid email required'),
  full_name: z.string().max(200).optional(),
  role_slug: z.string().min(1, 'Role is required'),
  department: z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
})
type Values = z.infer<typeof schema>

export function InviteEmployeeButton({ roles }: { roles: PortalRole[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role_slug: 'member' },
  })

  function onSubmit(values: Values) {
    setError(null)
    startTransition(async () => {
      try {
        await inviteEmployeeAction(values)
        toast.success(`Invitation sent to ${values.email}`)
        reset()
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to invite')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Invite Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="inv-email">Email Address *</Label>
            <Input id="inv-email" type="email" {...register('email')} placeholder="employee@company.com" />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inv-name">Full Name</Label>
            <Input id="inv-name" {...register('full_name')} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Select defaultValue="member" onValueChange={(v) => setValue('role_slug', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role…" />
              </SelectTrigger>
              <SelectContent position="popper">
                {roles.map((r) => (
                  <SelectItem key={r.slug} value={r.slug}>{r.name}</SelectItem>
                ))}
                {roles.length === 0 && (
                  <>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="procurement_manager">Procurement Manager</SelectItem>
                    <SelectItem value="procurement_officer">Procurement Officer</SelectItem>
                    <SelectItem value="warehouse_manager">Warehouse Manager</SelectItem>
                    <SelectItem value="finance_manager">Finance Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {errors.role_slug && <p className="text-xs text-red-600">{errors.role_slug.message}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-dept">Department</Label>
              <Input id="inv-dept" {...register('department')} placeholder="Procurement" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-desig">Designation</Label>
              <Input id="inv-desig" {...register('designation')} placeholder="Manager" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</> : 'Send Invite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
