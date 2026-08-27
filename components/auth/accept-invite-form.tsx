'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })
type Values = z.infer<typeof schema>

interface Props {
  token: string
  email: string
  fullName?: string
}

export function AcceptInviteForm({ token, email, fullName }: Props) {
  const [showPw, setShowPw] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } =
    useForm<Values>({ resolver: zodResolver(schema) })

  function onSubmit(values: Values) {
    setError(null)
    startTransition(async () => {
      try {
        // Step 1: Create/confirm the account via our server API
        // This uses the admin client to create the user with email pre-confirmed
        // so no additional email verification is needed
        const res = await fetch('/api/auth/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            email,
            password: values.password,
            fullName: fullName ?? '',
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Failed to create account. Please try again.')
          return
        }

        // Step 2: Sign in with the new credentials
        const supabase = createClient()
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password: values.password,
        })

        if (signInErr) {
          setError('Account created but sign-in failed. Please go to the login page.')
          return
        }

        // Step 3: Set company portal cookie (retry once in case of race condition
        // between DB trigger writing the users row and this API call)
        try {
          let portalRes = await fetch('/api/auth/set-company-portal', { method: 'POST' })
          if (!portalRes.ok) {
            // Brief wait then retry — DB trigger may not have fired yet
            await new Promise(r => setTimeout(r, 800))
            portalRes = await fetch('/api/auth/set-company-portal', { method: 'POST' })
          }
        } catch { /* non-critical */ }

        toast.success('Account created! Welcome to VendorFlow.')
        window.location.href = '/dashboard'

      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create account')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={email} readOnly className="bg-[--color-background-subtle] cursor-not-allowed" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inv-pw">Create Password *</Label>
        <div className="relative">
          <Input
            id="inv-pw"
            type={showPw ? 'text' : 'password'}
            {...register('password')}
            placeholder="At least 8 characters"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-foreground-subtle] hover:text-[--color-foreground-muted]"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inv-confirm">Confirm Password *</Label>
        <Input
          id="inv-confirm"
          type="password"
          {...register('confirm_password')}
          placeholder="Re-enter password"
        />
        {errors.confirm_password && (
          <p className="text-xs text-red-600">{errors.confirm_password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full mt-2">
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account…</>
        ) : (
          'Create Account & Join'
        )}
      </Button>
    </form>
  )
}
