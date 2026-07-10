'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { createGrnSchema } from '@/lib/validations/inventory'
import type { CreateGrnInput } from '@/lib/validations/inventory'
import type { Warehouse, Product } from '@/types/inventory'
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

interface GrnFormProps {
  warehouses: Warehouse[]
  products: Product[]
  openPOs: Array<{ id: string; po_number: string; vendor: { name: string } | null }>
  onSubmit: (values: CreateGrnInput) => Promise<void>
}

export function GrnForm({ warehouses, products, openPOs, onSubmit }: GrnFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateGrnInput>({
    resolver: zodResolver(createGrnSchema),
    defaultValues: {
      received_date: new Date().toISOString().slice(0, 10),
      items: [{ product_id: '', ordered_quantity: 0, received_quantity: 1, unit_cost: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  function handleSubmitForm(values: CreateGrnInput) {
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

      {/* Header info */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Receipt Details</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="warehouse_id">Warehouse *</Label>
            <Controller
              control={control}
              name="warehouse_id"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger id="warehouse_id">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.warehouse_id && <p className="text-xs text-red-600">{errors.warehouse_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="received_date">Received Date *</Label>
            <Input id="received_date" type="date" {...register('received_date')} />
            {errors.received_date && <p className="text-xs text-red-600">{errors.received_date.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purchase_order_id">Purchase Order (optional)</Label>
            <Controller
              control={control}
              name="purchase_order_id"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                  <SelectTrigger id="purchase_order_id">
                    <SelectValue placeholder="Link to a PO…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No PO</SelectItem>
                    {openPOs.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.po_number}{po.vendor ? ` — ${po.vendor.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register('notes')} rows={2} placeholder="Optional notes…" />
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[--color-foreground]">Received Items</h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append({ product_id: '', ordered_quantity: 0, received_quantity: 1, unit_cost: 0 })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Item
          </Button>
        </div>

        {errors.items?.root && (
          <p className="text-xs text-red-600">{errors.items.root.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] items-end rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3">
              {/* Product */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs">Product *</Label>
                <Controller
                  control={control}
                  name={`items.${index}.product_id`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select product…" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.items?.[index]?.product_id && (
                  <p className="text-xs text-red-600">{errors.items[index]?.product_id?.message}</p>
                )}
              </div>

              {/* Ordered qty */}
              <div className="space-y-1.5">
                <Label className="text-xs whitespace-nowrap">Ordered</Label>
                <Input
                  type="number" min="0" step="0.01"
                  {...register(`items.${index}.ordered_quantity`)}
                  className="h-8 w-24 text-xs"
                />
              </div>

              {/* Received qty */}
              <div className="space-y-1.5">
                <Label className="text-xs whitespace-nowrap">Received *</Label>
                <Input
                  type="number" min="0" step="0.01"
                  {...register(`items.${index}.received_quantity`)}
                  className="h-8 w-24 text-xs"
                />
                {errors.items?.[index]?.received_quantity && (
                  <p className="text-xs text-red-600">{errors.items[index]?.received_quantity?.message}</p>
                )}
              </div>

              {/* Unit cost */}
              <div className="space-y-1.5">
                <Label className="text-xs whitespace-nowrap">Unit Cost *</Label>
                <Input
                  type="number" min="0" step="0.01"
                  {...register(`items.${index}.unit_cost`)}
                  className="h-8 w-28 text-xs"
                />
              </div>

              {/* Remove */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 self-end"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Create GRN'}
        </Button>
      </div>
    </form>
  )
}
