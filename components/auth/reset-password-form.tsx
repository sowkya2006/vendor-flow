'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePassword } from '@/lib/supabase/auth'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type Values = z.infer<typeof schema>

export function ResetPasswordForm({ isInvited = false }: { isInvited?: boolean }) {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showCp, setShowCp] = useState(false)

  // Get invite_token from URL if present
  const inviteToken = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('invite_token')
    : null

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  async function onSubmit(values: Values) {
    const { error } = await updatePassword(values.password)
    if (error) {
      toast.error(error.message)
      return
    }

    if (isInvited) {
      // Apply invitation to link employee to company
      // The invite_token is passed via URL from magic-callback
      if (inviteToken) {
        try {
          const res = await fetch(`/api/auth/apply-invitation?token=${encodeURIComponent(inviteToken)}`, {
            method: 'POST',
          })
          if (!res.ok) {
            const d = await res.json()
            console.error('[reset-password] apply invitation failed:', d.error)
          }
        } catch (e) {
          console.error('[reset-password] apply invitation error:', e)
        }
      }
      toast.success('Password set! Welcome to VendorFlow.')
    } else {
      toast.success('Password updated successfully')
    }

    // Set company portal cookie and redirect to dashboard
    try {
      let portalRes = await fetch('/api/auth/set-company-portal', { method: 'POST' })
      if (!portalRes.ok) {
        // Brief wait then retry — DB trigger may not have fired yet
        await new Promise(r => setTimeout(r, 800))
        portalRes = await fetch('/api/auth/set-company-portal', { method: 'POST' })
      }
    } catch { /* non-critical */ }
    window.location.href = '/dashboard'
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* New Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="reset-password"
          className="block text-sm font-medium text-[--color-foreground]"
        >
          New password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="reset-password"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Min. 8 chars, 1 uppercase, 1 number"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'reset-password-error' : undefined}
            className="pl-10 pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-foreground-subtle] hover:text-[--color-foreground-muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] rounded"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p id="reset-password-error" className="text-xs text-[--color-error]" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="reset-confirm"
          className="block text-sm font-medium text-[--color-foreground]"
        >
          Confirm new password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="reset-confirm"
            type={showCp ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'reset-confirm-error' : undefined}
            className="pl-10 pr-10"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowCp((v) => !v)}
            aria-label={showCp ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-foreground-subtle] hover:text-[--color-foreground-muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] rounded"
          >
            {showCp ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="reset-confirm-error" className="text-xs text-[--color-error]" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" size="xl" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Updating…
          </>
        ) : (
          isInvited ? 'Set Password & Continue' : 'Update password'
        )}
      </Button>
    </form>
  )
}
