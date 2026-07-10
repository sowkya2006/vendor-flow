'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, CheckCircle2, Loader2, Users, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
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
  company_name: z.string().min(1, 'Company name is required').max(200),
  workspace_name: z.string().min(1, 'Workspace name is required').max(200),
  industry: z.string().min(1, 'Industry is required'),
  gst_number: z.string().max(50).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  timezone: z.string().min(1, 'Timezone is required'),
})

type FormValues = z.infer<typeof schema>

const STEPS = [
  { id: 1, label: 'Company', icon: Building2 },
  { id: 2, label: 'Workspace', icon: Building2 },
  { id: 3, label: 'Done', icon: CheckCircle2 },
]

export function WorkspaceSetupWizard() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { timezone: 'Asia/Kolkata' },
  })

  async function handleStep1() {
    const valid = await trigger(['company_name', 'industry', 'gst_number', 'phone', 'address'])
    if (valid) setStep(2)
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await setupWorkspaceAction(values)
        setStep(3)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Setup failed')
      }
    })
  }

  if (step === 3) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[--color-foreground]">Workspace Created!</h2>
          <p className="text-sm text-[--color-foreground-muted]">
            Your workspace is ready. Start by inviting employees or go straight to the dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => router.push('/settings/employees')}>
            <Users className="h-4 w-4 mr-2" />
            Create Employee
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.slice(0, 2).map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
              step >= s.id
                ? 'bg-[--color-primary] text-white'
                : 'bg-[--color-muted] text-[--color-foreground-muted]',
            )}>
              {s.id}
            </div>
            <span className={cn(
              'text-xs font-medium',
              step >= s.id ? 'text-[--color-foreground]' : 'text-[--color-foreground-muted]',
            )}>
              {s.label}
            </span>
            {i < 1 && <div className="h-px w-8 bg-[--color-border]" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Step 1 — Company */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" {...register('company_name')} placeholder="Acme Corporation" />
              {errors.company_name && <p className="text-xs text-red-600">{errors.company_name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Industry *</Label>
              <Select onValueChange={(v) => setValue('industry', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry…" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.industry && <p className="text-xs text-red-600">{errors.industry.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input id="gst_number" {...register('gst_number')} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register('address')} rows={2} placeholder="Registered office address…" />
            </div>

            <Button type="button" onClick={handleStep1} className="w-full">
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2 — Workspace */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="workspace_name">Workspace Name *</Label>
              <Input id="workspace_name" {...register('workspace_name')} placeholder="Acme Procurement Hub" />
              {errors.workspace_name && <p className="text-xs text-red-600">{errors.workspace_name.message}</p>}
              <p className="text-xs text-[--color-foreground-muted]">This name appears in the sidebar and dashboards.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Timezone *</Label>
              <Select defaultValue="Asia/Kolkata" onValueChange={(v) => setValue('timezone', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.timezone && <p className="text-xs text-red-600">{errors.timezone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Company Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="procurement@company.com" />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</> : 'Create Workspace'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
