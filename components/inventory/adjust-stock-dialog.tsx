'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SlidersHorizontal } from 'lucide-react'
import { adjustInventorySchema } from '@/lib/validations/inventory'
import type { AdjustInventoryInput } from '@/lib/validations/inventory'
import type { Warehouse } from '@/types/inventory'
import { adjustInventoryAction } from '@/app/(dashboard)/inventory/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdjustStockDialogProps {
  productId: string
  productName: string
  warehouses: Warehouse[]
  defaultWarehouseId?: string
  onSuccess?: () => void
}

export function AdjustStockDialog({
  productId,
  productName,
  warehouses,
  defaultWarehouseId,
  onSuccess,
}: AdjustStockDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AdjustInventoryInput>({
    resolver: zodResolver(adjustInventorySchema),
    defaultValues: {
      product_id: productId,
      warehouse_id: defaultWarehouseId ?? '',
      transaction_type: 'stock_in',
      quantity: 1,
    },
  })

  function handleSubmitForm(values: AdjustInventoryInput) {
    setError(null)
    startTransition(async () => {
      try {
        await adjustInventoryAction(values)
        reset()
        setOpen(false)
        onSuccess?.()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
          Adjust Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock — {productName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4 mt-2">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <input type="hidden" {...register('product_id')} />

          <div className="space-y-1.5">
            <Label>Warehouse *</Label>
            <Controller
              control={control}
              name="warehouse_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
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
            <Label>Type *</Label>
            <Controller
              control={control}
              name="transaction_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_in">Stock In (add)</SelectItem>
                    <SelectItem value="stock_out">Stock Out (remove)</SelectItem>
                    <SelectItem value="adjustment">Adjustment (+ or −)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              {...register('quantity')}
              placeholder="e.g. 50"
            />
            {errors.quantity && <p className="text-xs text-red-600">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={2} placeholder="Reason for adjustment…" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Apply Adjustment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
