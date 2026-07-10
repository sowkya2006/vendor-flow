'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { paymentSchema } from '@/lib/validations/invoice'
import type { PaymentFormValues } from '@/lib/validations/invoice'
import { PAYMENT_METHOD_LABELS } from '@/types/invoice'
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
import { formatCurrency } from '@/lib/utils'
import type { PaymentMethod } from '@/types/invoice'

interface PaymentFormProps {
  invoiceId: string
  invoiceNumber: string
  remainingAmount: number
  currency: string
  onSubmit: (values: PaymentFormValues) => Promise<void>
}

const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]

export function PaymentForm({
  invoiceId,
  invoiceNumber,
  remainingAmount,
  currency,
  onSubmit,
}: PaymentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: invoiceId,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'bank_transfer',
      amount: remainingAmount,
    },
  })

  function handleSubmitForm(values: PaymentFormValues) {
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
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Invoice info banner */}
      <div className="rounded-lg bg-[--color-background-subtle] border border-[--color-border] px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[--color-foreground-muted]">Invoice</span>
          <span className="font-medium text-[--color-foreground]">{invoiceNumber}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[--color-foreground-muted]">Remaining Balance</span>
          <span className="font-bold text-[--color-foreground]">
            {formatCurrency(remainingAmount)}
          </span>
        </div>
      </div>

      <input type="hidden" {...register('invoice_id')} />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Payment Amount ({currency}) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={remainingAmount}
            {...register('amount')}
            placeholder={String(remainingAmount)}
          />
          {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
          <p className="text-xs text-[--color-foreground-subtle]">
            Max payable: {formatCurrency(remainingAmount)}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment_method">Payment Method *</Label>
          <Controller
            control={control}
            name="payment_method"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Select method…" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.payment_method && <p className="text-xs text-red-600">{errors.payment_method.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment_date">Payment Date *</Label>
          <Input id="payment_date" type="date" {...register('payment_date')} />
          {errors.payment_date && <p className="text-xs text-red-600">{errors.payment_date.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes / Reference</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            rows={3}
            placeholder="Bank transfer reference, cheque number, UTR, etc."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Recording…' : 'Record Payment'}
        </Button>
      </div>
    </form>
  )
}
