'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type Values = z.infer<typeof schema>

export function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? '/dashboard'
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Values>({ resolver: zodResolver(schema) })

  async function onSubmit(values: Values) {
    try {
      const supabase = createClient()

      // 1. Sign out any existing session (vendor or otherwise)
      await supabase.auth.signOut()

      // 2. Sign in with company credentials
      const { error } = await supabase.auth.signInWithPassword({
        email:    values.email,
        password: values.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      // 3. Verify this is actually a company account
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Sign in failed. Please try again.'); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const { data: userRow } = await db
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!userRow?.company_id) {
        // Not a company account — sign out and show error
        await supabase.auth.signOut()
        toast.error('This email is not registered as a company account. Please use the Vendor Portal.')
        return
      }

      // 4. Set the portal cookie — tells the middleware this is a company session
      // This cookie is the primary routing signal. It persists for 7 days.
      document.cookie = 'vf_portal=company; path=/; max-age=604800; SameSite=Lax'
      // Also delete any stale vf_ctx
      document.cookie = 'vf_ctx=; path=/; max-age=0'

      toast.success('Welcome back!')

      // 5. Hard redirect — middleware will see vf_portal=company and allow through
      const dest = (!redirectTo || redirectTo.startsWith('/vendor'))
        ? '/dashboard'
        : redirectTo
      window.location.href = dest

    } catch {
      toast.error('Sign in failed. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-sm font-medium text-[--color-foreground]">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            className="pl-10"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-[--color-error]" role="alert">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-medium text-[--color-foreground]">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-[--color-primary] hover:underline outline-none">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="login-password"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            className="pl-10 pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-foreground-subtle] hover:text-[--color-foreground-muted]"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-[--color-error]" role="alert">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" size="xl" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? <><Loader2 className="size-4 animate-spin" />Signing in…</>
          : 'Sign in'
        }
      </Button>

      <p className="text-center text-sm text-[--color-foreground-muted]">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[--color-primary] font-medium hover:underline">
          Create account
        </Link>
      </p>
    </form>
  )
}
