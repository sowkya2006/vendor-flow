'use server'

import { revalidatePath } from 'next/cache'
import { createClient as _createClient } from '@/lib/supabase/server'

// Use `any` cast so actions aren't constrained by the generated DB types,
// which may be out of sync with the actual schema (e.g. missing tables).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createClient(): Promise<any> {
  return _createClient()
}
import {
  profileSchema,
  passwordSchema,
  notificationPrefsSchema,
  organizationSchema,
} from '@/lib/validations/settings'
import type {
  ProfileFormValues,
  PasswordFormValues,
  NotificationPrefsValues,
  OrganizationFormValues,
} from '@/lib/validations/settings'

type ActionResult = { success: true; message?: string } | { success: false; error: string }

// ── helper ────────────────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return { supabase, user }
}

// ── updateProfileAction ───────────────────────────────────────────────────────

export async function updateProfileAction(values: ProfileFormValues): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed' }
  }

  try {
    const { supabase, user } = await getAuthUser()

    // Update auth email if changed
    if (parsed.data.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: parsed.data.email,
      })
      if (emailError) return { success: false, error: emailError.message }
    }

    // Update profile row
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: parsed.data.full_name, email: parsed.data.email })
      .eq('id', user.id)

    if (profileError) return { success: false, error: profileError.message }

    revalidatePath('/settings')
    return { success: true, message: 'Profile updated successfully' }
  } catch (err) {
    return { success: false, error: (err as Error).message ?? 'Failed to update profile' }
  }
}

// ── updatePasswordAction ──────────────────────────────────────────────────────

export async function updatePasswordAction(values: PasswordFormValues): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed' }
  }

  try {
    const { supabase } = await getAuthUser()

    // Supabase doesn't expose a "verify current password" endpoint directly.
    // We re-authenticate via signInWithPassword to validate the current password.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: parsed.data.current_password,
    })

    if (signInError) {
      return { success: false, error: 'Current password is incorrect' }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.new_password,
    })

    if (updateError) return { success: false, error: updateError.message }

    return { success: true, message: 'Password updated successfully' }
  } catch (err) {
    return { success: false, error: (err as Error).message ?? 'Failed to update password' }
  }
}

// ── updateNotificationPrefsAction ─────────────────────────────────────────────

export async function updateNotificationPrefsAction(
  values: NotificationPrefsValues,
): Promise<ActionResult> {
  const parsed = notificationPrefsSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: 'Invalid preferences data' }
  }

  try {
    const { supabase, user } = await getAuthUser()

    // Upsert into notification_preferences table.
    // The table may not exist yet — we'll create it via migration, but the
    // action is written against the expected schema.
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...parsed.data }, { onConflict: 'user_id' })

    if (error) return { success: false, error: error.message }

    revalidatePath('/settings')
    return { success: true, message: 'Notification preferences saved' }
  } catch (err) {
    return { success: false, error: (err as Error).message ?? 'Failed to save preferences' }
  }
}

// ── updateOrganizationAction ──────────────────────────────────────────────────

export async function updateOrganizationAction(
  values: OrganizationFormValues,
): Promise<ActionResult> {
  const parsed = organizationSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed' }
  }

  try {
    const { supabase, user } = await getAuthUser()

    // Derive company_id from user metadata or public.users
    const companyId =
      (user.user_metadata?.company_id as string | undefined) ??
      (await (async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        return data?.company_id as string
      })())

    if (!companyId) return { success: false, error: 'No company found for this user' }

    const { error } = await supabase
      .from('companies')
      .update({
        name: parsed.data.org_name,
        timezone: parsed.data.timezone,
        currency: parsed.data.currency,
        fiscal_year_start: parsed.data.fiscal_year_start,
      })
      .eq('id', companyId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/settings')
    return { success: true, message: 'Organization settings saved' }
  } catch (err) {
    return { success: false, error: (err as Error).message ?? 'Failed to save organization settings' }
  }
}
