'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { createClient } from '@/lib/supabase/server'
import { createVendor, updateVendor, deleteVendor } from '@/lib/supabase/vendors'
import { vendorSchema } from '@/lib/validations/vendor'
import type { VendorFormValues } from '@/lib/validations/vendor'

// ── helpers ───────────────────────────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')

  const companyId = await getCompanyId()
  return { userId: user.id, companyId }
}

type ActionResult = { success: true } | { success: false; error: string }

// ── normalise form values ─────────────────────────────────────────────────────

function normalise(values: VendorFormValues) {
  return {
    ...values,
    website: values.website || null,
    email: values.email || null,
    phone: values.phone || null,
    address: values.address || null,
    notes: values.notes || null,
    contract_start_date: values.contract_start_date || null,
    contract_end_date: values.contract_end_date || null,
    contract_value: values.contract_value ?? null,
  }
}

// ── actions ───────────────────────────────────────────────────────────────────

/**
 * Create a new vendor. Redirects to the detail page on success.
 */
export async function createVendorAction(values: VendorFormValues): Promise<ActionResult> {
  const parsed = vendorSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed' }
  }

  try {
    const { userId, companyId } = await getAuthContext()
    const vendor = await createVendor({
      ...normalise(parsed.data),
      company_id: companyId,
      created_by: userId,
    })
    revalidatePath('/vendors')
    redirect(`/vendors/${vendor.id}`)
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
    return { success: false, error: (err as Error).message ?? 'Failed to create vendor' }
  }
}

/**
 * Update an existing vendor. Redirects to the detail page on success.
 */
export async function updateVendorAction(
  id: string,
  values: VendorFormValues,
): Promise<ActionResult> {
  const parsed = vendorSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Validation failed' }
  }

  try {
    const { companyId } = await getAuthContext()
    await updateVendor({ id, ...normalise(parsed.data) }, companyId)
    revalidatePath('/vendors')
    revalidatePath(`/vendors/${id}`)
    redirect(`/vendors/${id}`)
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
    return { success: false, error: (err as Error).message ?? 'Failed to update vendor' }
  }
}

/**
 * Delete a vendor and redirect to the list.
 */
export async function deleteVendorAction(id: string): Promise<ActionResult> {
  try {
    const { companyId } = await getAuthContext()
    await deleteVendor(id, companyId)
    revalidatePath('/vendors')
    redirect('/vendors')
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
    return { success: false, error: (err as Error).message ?? 'Failed to delete vendor' }
  }
}
