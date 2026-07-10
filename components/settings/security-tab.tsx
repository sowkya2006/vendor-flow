'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { passwordSchema, type PasswordFormValues } from '@/lib/validations/settings'
import { updatePasswordAction } from '@/app/actions/settings'

// ── helpers ───────────────────────────────────────────────────────────────────

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-[--color-foreground]"
    >
      {children}
      {required && <span className="ml-0.5 text-[--color-destructive]">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-[--color-destructive]">{message}</p>
}

// ── password field with show/hide toggle ──────────────────────────────────────

function PasswordField({
  id,
  placeholder,
  invalid,
  registration,
}: {
  id: string
  placeholder?: string
  invalid?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        aria-invalid={invalid}
        className="pr-10"
        {...registration}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[--color-foreground-muted] hover:text-[--color-foreground] transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ── password strength bar ─────────────────────────────────────────────────────

function strengthScore(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const STRENGTH_LABELS = ['', 'Very weak', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLORS = [
  '',
  'bg-[--color-destructive]',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-blue-500',
  'bg-green-500',
]

function StrengthBar({ password }: { password: string }) {
  const score = strengthScore(password)
  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={[
              'h-1 flex-1 rounded-full transition-colors',
              n <= score ? STRENGTH_COLORS[score] : 'bg-[--color-border]',
            ].join(' ')}
          />
        ))}
      </div>
      <p className="text-xs text-[--color-foreground-muted]">
        {STRENGTH_LABELS[score]}
      </p>
    </div>
  )
}

// ── component ─────────────────────────────────────────────────────────────────

export function SecurityTab() {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const newPassword = watch('new_password')

  function onSubmit(values: PasswordFormValues) {
    startTransition(async () => {
      const result = await updatePasswordAction(values)
      if (result.success) {
        toast.success(result.message ?? 'Password updated')
        reset()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Change password */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
          <h2 className="mb-1 text-sm font-semibold text-[--color-foreground]">Change password</h2>
          <p className="mb-6 text-xs text-[--color-foreground-muted]">
            Use a strong password with at least 8 characters, including uppercase letters, numbers,
            and special characters.
          </p>

          <div className="max-w-md space-y-4">
            {/* Current password */}
            <div className="flex flex-col">
              <Label htmlFor="current_password" required>Current password</Label>
              <PasswordField
                id="current_password"
                placeholder="Enter your current password"
                invalid={!!errors.current_password}
                registration={register('current_password')}
              />
              <FieldError message={errors.current_password?.message} />
            </div>

            {/* New password */}
            <div className="flex flex-col">
              <Label htmlFor="new_password" required>New password</Label>
              <PasswordField
                id="new_password"
                placeholder="Enter a new password"
                invalid={!!errors.new_password}
                registration={register('new_password')}
              />
              <FieldError message={errors.new_password?.message} />
              <StrengthBar password={newPassword} />
            </div>

            {/* Confirm password */}
            <div className="flex flex-col">
              <Label htmlFor="confirm_password" required>Confirm new password</Label>
              <PasswordField
                id="confirm_password"
                placeholder="Re-enter your new password"
                invalid={!!errors.confirm_password}
                registration={register('confirm_password')}
              />
              <FieldError message={errors.confirm_password?.message} />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </div>
        </section>
      </form>

      {/* Active sessions — informational */}
      <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[--color-primary]" />
          <div>
            <h2 className="text-sm font-semibold text-[--color-foreground]">Session security</h2>
            <p className="mt-1 text-xs text-[--color-foreground-muted]">
              Your session is protected by Supabase Auth. All tokens are short-lived and rotated
              automatically. If you suspect unauthorized access, change your password immediately.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
