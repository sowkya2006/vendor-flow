'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createProductSchema, updateProductSchema } from '@/lib/validations/inventory'
import type { CreateProductInput } from '@/lib/validations/inventory'
import type { ProductCategory, Warehouse } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProductFormProps {
  defaultValues?: Partial<CreateProductInput>
  categories: ProductCategory[]
  vendors: Array<{ id: string; name: string }>
  onSubmit: (values: CreateProductInput) => Promise<void>
  submitLabel?: string
}

const UNIT_OPTIONS = ['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'carton', 'dozen', 'pair', 'set', 'roll', 'sheet', 'm', 'cm']

export function ProductForm({
  defaultValues,
  categories,
  vendors,
  onSubmit,
  submitLabel = 'Save Product',
}: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      status: 'active',
      unit: 'pcs',
      unit_cost: 0,
      min_stock_level: 0,
      reorder_level: 0,
      lead_time_days: 0,
      ...defaultValues,
    },
  })

  const status = watch('status')
  const unit = watch('unit')

  function handleSubmitForm(values: CreateProductInput) {
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Basic Information</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" {...register('name')} placeholder="e.g. Blue Ballpoint Pen" />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU *</Label>
            <Input id="sku" {...register('sku')} placeholder="e.g. PEN-BLUE-001" />
            {errors.sku && <p className="text-xs text-red-600">{errors.sku.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} rows={3} placeholder="Optional description…" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="category_id">Category</Label>
            <Select
              value={watch('category_id') ?? ''}
              onValueChange={(v) => setValue('category_id', v === 'none' ? null : v)}
            >
              <SelectTrigger id="category_id">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preferred_vendor_id">Preferred Vendor</Label>
            <Select
              value={watch('preferred_vendor_id') ?? ''}
              onValueChange={(v) => setValue('preferred_vendor_id', v === 'none' ? null : v)}
            >
              <SelectTrigger id="preferred_vendor_id">
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={(v) => setValue('status', v as 'active' | 'inactive' | 'discontinued')}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pricing & units */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Pricing & Units</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="unit_cost">Unit Cost *</Label>
            <Input id="unit_cost" type="number" step="0.01" min="0" {...register('unit_cost')} placeholder="0.00" />
            {errors.unit_cost && <p className="text-xs text-red-600">{errors.unit_cost.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unit of Measure *</Label>
            <Select value={unit} onValueChange={(v) => setValue('unit', v)}>
              <SelectTrigger id="unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unit && <p className="text-xs text-red-600">{errors.unit.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead_time_days">Lead Time (days)</Label>
            <Input id="lead_time_days" type="number" min="0" step="1" {...register('lead_time_days')} placeholder="0" />
          </div>
        </div>
      </div>

      {/* Stock levels */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Stock Levels</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="min_stock_level">Min Stock Level</Label>
            <Input id="min_stock_level" type="number" min="0" step="0.01" {...register('min_stock_level')} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reorder_level">Reorder Level</Label>
            <Input id="reorder_level" type="number" min="0" step="0.01" {...register('reorder_level')} placeholder="0" />
            <p className="text-xs text-[--color-foreground-subtle]">Alert triggers when stock falls to this level</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_stock_level">Max Stock Level</Label>
            <Input id="max_stock_level" type="number" min="0" step="0.01" {...register('max_stock_level')} placeholder="Unlimited" />
            {errors.max_stock_level && <p className="text-xs text-red-600">{errors.max_stock_level.message}</p>}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Notes</h3>
        <Textarea {...register('notes')} rows={3} placeholder="Internal notes…" />
      </div>

      {/* Actions */}
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
