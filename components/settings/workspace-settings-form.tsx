'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { setupWorkspaceAction } from '@/app/workspace/actions'

const INDUSTRIES = [
  'Manufacturing', 'Retail', 'Technology', 'Healthcare', 'Construction',
  'Logistics', 'Education', 'Finance', 'Government', 'Other',
]
const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles',
  'Australia/Sydney',
]

const schema = z.object({
  company_name: z.string().min(1, 'Required').max(200),
  workspace_name: z.string().min(1, 'Required').max(200),
  industry: z.string().min(1, 'Required'),
  gst_number: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  timezone: z.string().min(1, 'Required'),
})
type Values = z.infer<typeof schema>

export function WorkspaceSettingsForm({ defaultValues }: { defaultValues: Partial<Values> }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { timezone: 'Asia/Kolkata', ...defaultValues },
  })

  function onSubmit(values: Values) {
    setError(null)
    startTransition(async () => {
      try {
        await setupWorkspaceAction(values)
        toast.success('Workspace settings saved')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ws-company">Company Name *</Label>
          <Input id="ws-company" {...register('company_name')} />
          {errors.company_name && <p className="text-xs text-red-600">{errors.company_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ws-workspace">Workspace Name *</Label>
          <Input id="ws-workspace" {...register('workspace_name')} />
          {errors.workspace_name && <p className="text-xs text-red-600">{errors.workspace_name.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Industry *</Label>
          <Select defaultValue={defaultValues.industry ?? ''} onValueChange={(v) => setValue('industry', v)}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.industry && <p className="text-xs text-red-600">{errors.industry.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Timezone *</Label>
          <Select defaultValue={defaultValues.timezone ?? 'Asia/Kolkata'} onValueChange={(v) => setValue('timezone', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ws-gst">GST Number</Label>
          <Input id="ws-gst" {...register('gst_number')} placeholder="22AAAAA0000A1Z5" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ws-phone">Phone</Label>
          <Input id="ws-phone" {...register('phone')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ws-address">Address</Label>
        <Textarea id="ws-address" {...register('address')} rows={2} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}
