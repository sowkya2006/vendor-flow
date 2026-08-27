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

      // 1. Sign out any existing session
      await supabase.auth.signOut()

      // 2. Sign in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email:    values.email,
        password: values.password,
      })

      if (signInErr) {
        setError(signInErr.message)
        return
      }

      // 3. Ask the server to check vendor records and set the httpOnly portal cookie.
      //    We use an API route because:
      //    a) Admin client (service role) is needed to bypass RLS on vendor_companies
      //    b) httpOnly cookies can only be set from server responses
      const checkRes = await fetch('/api/auth/check-vendor')
      const checkData = await checkRes.json()

      if (checkData.portal === 'vendor') {
        // Cookie already set by the API route
        // Check if vendor profile is complete
        const profileRes = await fetch('/api/auth/check-vendor-profile')
        const profileData = await profileRes.json()
        window.location.href = profileData.hasProfile ? '/vendor/dashboard' : '/vendor/complete-profile'
        return
      }

      if (checkData.portal === 'company') {
        await supabase.auth.signOut()
        setError('This email belongs to a company account. Please use the Company Portal.')
        return
      }

      // No vendor record found — might be a new user
      await supabase.auth.signOut()
      document.cookie = 'vf_portal=; path=/; max-age=0; SameSite=Lax'
      document.cookie = 'vf_ctx=; path=/; max-age=0; SameSite=Lax'
      window.location.href = '/vendor/register'

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
