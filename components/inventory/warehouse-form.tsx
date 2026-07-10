'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createWarehouseSchema } from '@/lib/validations/inventory'
import type { CreateWarehouseInput } from '@/lib/validations/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface WarehouseFormProps {
  defaultValues?: Partial<CreateWarehouseInput>
  onSubmit: (values: CreateWarehouseInput) => Promise<void>
  submitLabel?: string
}

export function WarehouseForm({ defaultValues, onSubmit, submitLabel = 'Save Warehouse' }: WarehouseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWarehouseInput>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: {
      is_default: false,
      is_active: true,
      ...defaultValues,
    },
  })

  const isDefault = watch('is_default')
  const isActive = watch('is_active')

  function handleSubmitForm(values: CreateWarehouseInput) {
    setError(null)
    startTransition(async () => {
      try {
        await onSubmit(values)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Warehouse Details</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g. Main Warehouse" />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Code *</Label>
            <Input id="code" {...register('code')} placeholder="e.g. WH-01" />
            {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" {...register('address')} rows={3} placeholder="Full warehouse address…" />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="is_default"
              checked={isDefault}
              onCheckedChange={(v: boolean) => setValue('is_default', v)}
            />
            <Label htmlFor="is_default" className="cursor-pointer">Default warehouse</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(v: boolean) => setValue('is_active', v)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
