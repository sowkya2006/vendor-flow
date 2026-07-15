'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { completeInvitationAction } from '@/app/invite/actions'

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
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  function onSubmit(values: Values) {
    setError(null)
    startTransition(async () => {
      try {
        const supabase = createClient()

        // Try to sign up with this email + password
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password: values.password,
          options: {
            data: { full_name: fullName ?? '' },
            emailRedirectTo: `${window.location.origin}/auth/callback?invite_token=${token}`,
          },
        })

        if (signUpErr) {
          // User might already exist — try signing in instead
          if (signUpErr.message.toLowerCase().includes('already registered')) {
            const { error: signInErr } = await supabase.auth.signInWithPassword({
              email,
              password: values.password,
            })
            if (signInErr) throw new Error('This email is already registered. Try signing in with your existing password.')

            // Signed in — now complete the invitation server-side
            await completeInvitationAction(token)
            document.cookie = 'vf_portal=company; path=/; max-age=604800; SameSite=Lax'
            document.cookie = 'vf_ctx=; path=/; max-age=0'
            toast.success('Invitation accepted! Welcome to VendorFlow.')
            window.location.href = '/dashboard'
            return
          }
          throw signUpErr
        }

        // If email confirmation is disabled in Supabase (recommended for invites),
        // the user is immediately active. Complete invitation server-side.
        if (signUpData.session) {
          await completeInvitationAction(token)
          document.cookie = 'vf_portal=company; path=/; max-age=604800; SameSite=Lax'
          document.cookie = 'vf_ctx=; path=/; max-age=0'
          toast.success('Account created! Welcome to VendorFlow.')
          window.location.href = '/dashboard'
        } else {
          // Email confirmation required — tell user to check email
          toast.success('Check your email for a confirmation link, then sign in.')
          router.push('/company/login?invited=1')
        }
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
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating account…
          </>
        ) : (
          'Create Account & Join'
        )}
      </Button>
    </form>
  )
}
