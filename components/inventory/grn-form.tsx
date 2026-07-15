'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Info, Loader2, PackageCheck } from 'lucide-react'
import { createGrnSchema } from '@/lib/validations/inventory'
import type { CreateGrnInput } from '@/lib/validations/inventory'
import type { Warehouse, Product } from '@/types/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

interface POItem {
  id?: string
  description: string
  quantity: number
  unit: string | null
  unit_price: number
}

interface OpenPO {
  id: string
  po_number: string
  vendor: { name: string } | null
  items?: POItem[] | null
}

interface GrnFormProps {
  warehouses: Warehouse[]
  products: Product[]
  openPOs: OpenPO[]
  onSubmit: (values: CreateGrnInput) => Promise<void>
  defaultPOId?: string | null
}

export function GrnForm({ warehouses, products, openPOs, onSubmit, defaultPOId }: GrnFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const initialPO = defaultPOId ? openPOs.find((p) => p.id === defaultPOId) ?? null : null

  const buildItemsFromPO = (po: OpenPO) =>
    (po.items ?? []).map((item) => ({
      product_id: null as string | null,
      item_name: item.description,
      description: item.description,
      sku: null as string | null,
      unit: item.unit ?? null,
      tax_percentage: 0,  // not stored in purchase_order_items schema
      ordered_quantity: item.quantity,
      received_quantity: item.quantity,
      accepted_quantity: item.quantity,
      rejected_quantity: 0,
      damage_notes: null as string | null,
      batch_number: null as string | null,
      serial_numbers: null as string | null,
      warehouse_location: null as string | null,
      unit_cost: item.unit_price,
      notes: null as string | null,
    }))

  const emptyItem = () => ({
    product_id: null as string | null,
    item_name: null as string | null,
    description: null as string | null,
    sku: null as string | null,
    unit: null as string | null,
    tax_percentage: 0,
    ordered_quantity: 0,
    received_quantity: 1,
    accepted_quantity: 1,
    rejected_quantity: 0,
    damage_notes: null as string | null,
    batch_number: null as string | null,
    serial_numbers: null as string | null,
    warehouse_location: null as string | null,
    unit_cost: 0,
    notes: null as string | null,
  })

  const [selectedPO, setSelectedPO] = useState<OpenPO | null>(initialPO)
  const [autoFilled, setAutoFilled] = useState(!!initialPO)

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
      purchase_order_id: defaultPOId ?? undefined,
      received_date: new Date().toISOString().slice(0, 10),
      items: initialPO?.items?.length ? buildItemsFromPO(initialPO) : [emptyItem()],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' })

  const handlePOChange = useCallback((poId: string) => {
    if (poId === 'none' || !poId) {
      setValue('purchase_order_id', null)
      setSelectedPO(null)
      setAutoFilled(false)
      replace([emptyItem()])
      return
    }
    const po = openPOs.find((p) => p.id === poId)
    setValue('purchase_order_id', poId)
    setSelectedPO(po ?? null)
    if (po?.items && po.items.length > 0) {
      replace(buildItemsFromPO(po))
      setAutoFilled(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPOs, setValue, replace])

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

  const watchedItems = watch('items') ?? []

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Receipt Details</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Warehouse */}
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

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="received_date">Received Date *</Label>
            <Input id="received_date" type="date" {...register('received_date')} />
            {errors.received_date && <p className="text-xs text-red-600">{errors.received_date.message}</p>}
          </div>

          {/* PO Link */}
          <div className="space-y-1.5">
            <Label htmlFor="purchase_order_id">
              Purchase Order
              <span className="ml-1 text-[10px] text-[--color-primary] font-medium">(auto-fills items)</span>
            </Label>
            <Controller
              control={control}
              name="purchase_order_id"
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={handlePOChange}>
                  <SelectTrigger id="purchase_order_id">
                    <SelectValue placeholder="Select PO…" />
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

        {autoFilled && selectedPO && (
          <div className="flex items-start gap-2.5 rounded-lg border border-[--color-primary]/20 bg-[--color-primary]/5 px-3.5 py-3 text-xs text-[--color-foreground-muted]">
            <Info className="h-4 w-4 text-[--color-primary] shrink-0 mt-0.5" />
            <span>
              Items auto-filled from <strong className="text-[--color-foreground]">{selectedPO.po_number}</strong>.
              Update received/accepted/rejected quantities. Optionally link to a product in your catalogue.
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="notes">Delivery Notes / Remarks</Label>
          <Textarea id="notes" {...register('notes')} rows={2} placeholder="Any notes about the delivery…" />
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[--color-foreground]">
            Received Items
            {autoFilled && <span className="ml-2 text-[10px] font-normal text-[--color-primary]">Auto-filled from PO</span>}
          </h3>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => append(emptyItem())}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Item
          </Button>
        </div>

        {errors.items?.root && (
          <p className="text-xs text-red-600">{errors.items.root.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => {
            const poItem = autoFilled && selectedPO?.items?.[index]
            const orderedQty = Number(watchedItems[index]?.ordered_quantity) || 0
            const receivedQty = Number(watchedItems[index]?.received_quantity) || 0
            const rejectedQty = Number(watchedItems[index]?.rejected_quantity) || 0
            const unitCost = Number(watchedItems[index]?.unit_cost) || 0
            const lineTotal = receivedQty * unitCost

            return (
              <div key={field.id} className="rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-4 space-y-3">
                {/* Row header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-[--color-primary] shrink-0" />
                    <span className="text-xs font-semibold text-[--color-foreground]">
                      Item {index + 1}
                      {poItem && (
                        <span className="ml-2 font-normal text-[--color-primary]">
                          — PO: {poItem.description} × {poItem.quantity} {poItem.unit ?? ''}
                        </span>
                      )}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Item name / description — always stored */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Item Name / Description *</Label>
                    <Input
                      {...register(`items.${index}.item_name`)}
                      placeholder="e.g. Steel Bolts M8"
                      className="h-8 text-xs"
                      readOnly={autoFilled && !!poItem}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">SKU (optional)</Label>
                    <Input
                      {...register(`items.${index}.sku`)}
                      placeholder="e.g. BOLT-M8-SS"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Quantities row */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Ordered Qty</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      {...register(`items.${index}.ordered_quantity`)}
                      className="h-8 text-xs"
                      readOnly={autoFilled && !!poItem}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Received Qty *</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      {...register(`items.${index}.received_quantity`)}
                      className={`h-8 text-xs ${receivedQty < orderedQty && orderedQty > 0 ? 'border-amber-400' : ''}`}
                    />
                    {receivedQty < orderedQty && orderedQty > 0 && (
                      <p className="text-[10px] text-amber-600">{orderedQty - receivedQty} short</p>
                    )}
                    {errors.items?.[index]?.received_quantity && (
                      <p className="text-[11px] text-red-600">{errors.items[index]?.received_quantity?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Accepted Qty</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      {...register(`items.${index}.accepted_quantity`)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Rejected Qty</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      {...register(`items.${index}.rejected_quantity`)}
                      className={`h-8 text-xs ${rejectedQty > 0 ? 'border-red-300' : ''}`}
                    />
                  </div>
                </div>

                {/* Pricing row */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Unit</Label>
                    <Input
                      {...register(`items.${index}.unit`)}
                      placeholder="pcs / kg / m…"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Unit Cost *</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      {...register(`items.${index}.unit_cost`)}
                      className="h-8 text-xs"
                      readOnly={autoFilled && !!poItem}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Tax %</Label>
                    <Input
                      type="number" min="0" max="100" step="0.01"
                      {...register(`items.${index}.tax_percentage`)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Optional fields */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Warehouse Location</Label>
                    <Input
                      {...register(`items.${index}.warehouse_location`)}
                      placeholder="e.g. Rack A-12"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Batch / Lot Number</Label>
                    <Input
                      {...register(`items.${index}.batch_number`)}
                      placeholder="e.g. BATCH-2024-001"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Serial Numbers</Label>
                    <Input
                      {...register(`items.${index}.serial_numbers`)}
                      placeholder="Comma-separated"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Damage notes */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Damage Notes</Label>
                    <Input
                      {...register(`items.${index}.damage_notes`)}
                      placeholder="Describe any damages…"
                      className="h-8 text-xs"
                    />
                  </div>
                  {/* Optional product link */}
                  <div className="space-y-1">
                    <Label className="text-[11px]">Link to Product (optional)</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.product_id`}
                      render={({ field }) => (
                        <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Link product…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No product linked</SelectItem>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Line total */}
                {lineTotal > 0 && (
                  <div className="flex justify-end">
                    <p className="text-xs font-medium text-[--color-foreground-muted]">
                      Line total: <span className="text-[--color-foreground] font-bold">{formatCurrency(lineTotal)}</span>
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {watchedItems.length > 0 && (
          <div className="flex justify-end pt-2 border-t border-[--color-border]">
            <p className="text-sm font-bold text-[--color-foreground]">
              GRN Total: {formatCurrency(
                watchedItems.reduce((s, i) => s + (Number(i.received_quantity) || 0) * (Number(i.unit_cost) || 0), 0)
              )}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Create GRN
        </Button>
      </div>
    </form>
  )
}
