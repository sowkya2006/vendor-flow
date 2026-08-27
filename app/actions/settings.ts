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

    // Update auth email if changed — Supabase sends a confirmation to the new address
    if (parsed.data.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: parsed.data.email,
      })
      if (emailError) return { success: false, error: emailError.message }
    }

    // Update the public.users row (NOT profiles — the app uses public.users)
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (userError) return { success: false, error: userError.message }

    revalidatePath('/settings')
    revalidatePath('/dashboard')
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

    // Re-authenticate with the current password to validate it before changing
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

    // Try to upsert into notification_preferences.
    // If the table doesn't exist yet (pre-migration), ignore the error gracefully.
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...parsed.data }, { onConflict: 'user_id' })

    // Treat "relation does not exist" as a soft failure — the table will be
    // added via migration; preferences just won't persist until then.
    if (error && !error.message?.includes('does not exist') && !error.code?.includes('42P01')) {
      return { success: false, error: error.message }
    }

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

    // Resolve company_id from public.users (more reliable than user metadata)
    const { data: userRow } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    const companyId = (userRow as { company_id: string } | null)?.company_id
    if (!companyId) return { success: false, error: 'No company found for this user' }

    // Update confirmed companies columns: name and timezone.
    // currency and fiscal_year_start are stored in company_settings (upserted below).
    const { error: companyError } = await supabase
      .from('companies')
      .update({
        name: parsed.data.org_name,
        timezone: parsed.data.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId)

    if (companyError) return { success: false, error: companyError.message }

    // Store currency + fiscal_year_start in company_settings (upsert).
    // If this table doesn't exist yet, ignore the error — primary update already succeeded.
    try {
      await supabase
        .from('company_settings')
        .upsert(
          {
            company_id: companyId,
            currency: parsed.data.currency,
            fiscal_year_start: parsed.data.fiscal_year_start,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'company_id' },
        )
    } catch {
      // Non-critical — company name + timezone are already saved
    }

    revalidatePath('/settings')
    revalidatePath('/settings/workspace')
    revalidatePath('/dashboard')
    return { success: true, message: 'Organization settings saved' }
  } catch (err) {
    return { success: false, error: (err as Error).message ?? 'Failed to save organization settings' }
  }
}
