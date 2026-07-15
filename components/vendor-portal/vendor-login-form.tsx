'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type Values = z.infer<typeof schema>

export function VendorLoginForm() {
  const searchParams = useSearchParams()
  const verified     = searchParams.get('verified') === '1'

  const [showPw,    setShowPw]    = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } =
    useForm<Values>({ resolver: zodResolver(schema) })

  async function onSubmit(values: Values) {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Sign out any existing session (company or otherwise)
      await supabase.auth.signOut()

      // 2. Sign in with vendor credentials
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    values.email,
        password: values.password,
      })

      if (signInErr) {
        setError(signInErr.message)
        return
      }

      // 3. Verify this is actually a vendor account
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Sign in failed. Please try again.'); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const [{ data: vc }, { data: vu }] = await Promise.all([
        db.from('vendor_companies').select('id').eq('user_id', user.id).maybeSingle(),
        db.from('vendor_users').select('id').eq('user_id', user.id).maybeSingle(),
      ])

      if (!vc && !vu) {
        // Check if it's a company account
        const { data: companyRow } = await db
          .from('users').select('company_id').eq('id', user.id).maybeSingle()

        await supabase.auth.signOut()

        if (companyRow?.company_id) {
          setError('This email belongs to a company account. Please use the Company Portal.')
        } else {
          // New vendor — send to registration
          document.cookie = 'vf_portal=vendor; path=/; max-age=604800; SameSite=Lax'
          document.cookie = 'vf_ctx=; path=/; max-age=0'
          window.location.href = '/vendor/register'
        }
        return
      }

      // 4. Set the portal cookie — tells the middleware this is a vendor session
      // This cookie is the primary routing signal. It persists for 7 days.
      document.cookie = 'vf_portal=vendor; path=/; max-age=604800; SameSite=Lax'
      // Also delete any stale vf_ctx
      document.cookie = 'vf_ctx=; path=/; max-age=0'

      // 5. Hard redirect to vendor portal
      window.location.href = '/vendor/dashboard'

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {verified && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          Email verified! Please sign in to access your vendor account.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="v-email" className="block text-sm font-medium text-[--color-foreground]">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="v-email"
            type="email"
            autoComplete="email"
            placeholder="vendor@company.com"
            className="pl-10"
            {...register('email')}
          />
        </div>
        {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="v-pw" className="block text-sm font-medium text-[--color-foreground]">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--color-foreground-subtle] pointer-events-none" />
          <Input
            id="v-pw"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
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
        {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading
          ? <><Loader2 className="size-4 animate-spin mr-2" />Signing in…</>
          : 'Sign in to Vendor Portal'
        }
      </Button>
    </form>
  )
}
