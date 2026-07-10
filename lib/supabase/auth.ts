import { createClient } from './client'

export type AuthError = { message: string }

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? { message: error.message } : null }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { error: error ? { message: error.message } : null }
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error: error ? { message: error.message } : null }
}

export async function resetPasswordForEmail(
  email: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  })
  return { error: error ? { message: error.message } : null }
}

export async function updatePassword(
  newPassword: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error: error ? { message: error.message } : null }
}

export async function resendVerificationEmail(
  email: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { error: error ? { message: error.message } : null }
}
