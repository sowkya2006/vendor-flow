'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateNotificationPrefsAction } from '@/app/actions/settings'
import type { NotificationPrefsValues } from '@/lib/validations/settings'

// ── toggle ─────────────────────────────────────────────────────────────────────

function Toggle({
  id,
  checked,
  onChange,
  disabled,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-[--color-primary]' : 'bg-[--color-muted]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md',
          'transform transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

// ── pref row ───────────────────────────────────────────────────────────────────

function PrefRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[--color-foreground] cursor-pointer"
        >
          {label}
        </label>
        <p className="mt-0.5 text-xs text-[--color-foreground-muted]">{description}</p>
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

// ── section ────────────────────────────────────────────────────────────────────

function PrefSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-[--color-foreground-subtle]">
        {title}
      </h3>
      <div className="divide-y divide-[--color-border]">{children}</div>
    </div>
  )
}

// ── default prefs ──────────────────────────────────────────────────────────────

const DEFAULT_PREFS: NotificationPrefsValues = {
  vendor_submitted: true,
  vendor_approved: true,
  vendor_rejected: true,
  approval_requested: true,
  approval_completed: true,
  po_created: false,
  po_approved: true,
  rfq_received: true,
  quotation_received: true,
}

// ── props ──────────────────────────────────────────────────────────────────────

interface NotificationsTabProps {
  prefs?: Partial<NotificationPrefsValues>
}

// ── component ──────────────────────────────────────────────────────────────────

export function NotificationsTab({ prefs }: NotificationsTabProps) {
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<NotificationPrefsValues>({
    ...DEFAULT_PREFS,
    ...prefs,
  })

  function set(key: keyof NotificationPrefsValues) {
    return (v: boolean) => setValues((prev) => ({ ...prev, [key]: v }))
  }

  function onSave() {
    startTransition(async () => {
      const result = await updateNotificationPrefsAction(values)
      if (result.success) {
        toast.success(result.message ?? 'Preferences saved')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
        <h2 className="mb-1 text-sm font-semibold text-[--color-foreground]">
          Notification preferences
        </h2>
        <p className="mb-6 text-xs text-[--color-foreground-muted]">
          Choose which in-app notifications you receive. Email notifications follow the same preferences.
        </p>

        <div className="space-y-6">
          <PrefSection title="Vendors">
            <PrefRow
              id="vendor_submitted"
              label="Vendor submitted"
              description="When a new vendor onboarding form is submitted"
              checked={values.vendor_submitted}
              onChange={set('vendor_submitted')}
              disabled={isPending}
            />
            <PrefRow
              id="vendor_approved"
              label="Vendor approved"
              description="When a vendor is approved by a reviewer"
              checked={values.vendor_approved}
              onChange={set('vendor_approved')}
              disabled={isPending}
            />
            <PrefRow
              id="vendor_rejected"
              label="Vendor rejected"
              description="When a vendor application is rejected"
              checked={values.vendor_rejected}
              onChange={set('vendor_rejected')}
              disabled={isPending}
            />
          </PrefSection>

          <PrefSection title="Approvals">
            <PrefRow
              id="approval_requested"
              label="Approval requested"
              description="When an approval request is assigned to you"
              checked={values.approval_requested}
              onChange={set('approval_requested')}
              disabled={isPending}
            />
            <PrefRow
              id="approval_completed"
              label="Approval completed"
              description="When a request you raised is fully approved or rejected"
              checked={values.approval_completed}
              onChange={set('approval_completed')}
              disabled={isPending}
            />
          </PrefSection>

          <PrefSection title="Procurement">
            <PrefRow
              id="rfq_received"
              label="RFQ received"
              description="When a new request for quotation is created"
              checked={values.rfq_received}
              onChange={set('rfq_received')}
              disabled={isPending}
            />
            <PrefRow
              id="quotation_received"
              label="Quotation received"
              description="When a vendor submits a quotation"
              checked={values.quotation_received}
              onChange={set('quotation_received')}
              disabled={isPending}
            />
            <PrefRow
              id="po_created"
              label="Purchase order created"
              description="When a new purchase order is raised"
              checked={values.po_created}
              onChange={set('po_created')}
              disabled={isPending}
            />
            <PrefRow
              id="po_approved"
              label="Purchase order approved"
              description="When a purchase order you created is approved"
              checked={values.po_approved}
              onChange={set('po_approved')}
              disabled={isPending}
            />
          </PrefSection>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save preferences
          </Button>
        </div>
      </section>
    </div>
  )
}
