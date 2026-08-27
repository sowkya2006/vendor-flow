'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-auth'
import { z } from 'zod'

const workspaceSchema = z.object({
  company_name: z.string().min(1).max(200),
  workspace_name: z.string().min(1).max(200),
  industry: z.string().min(1),
  gst_number: z.string().max(50).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  timezone: z.string().min(1),
})

export async function setupWorkspaceAction(input: unknown) {
  const parsed = workspaceSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error('Invalid workspace data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const values = parsed.data
  const user = await getUser()

  // Use admin client to bypass RLS for workspace setup
  // New admins may not yet have RLS policies fully evaluated
  const { createAdminClient } = await import('@/lib/supabase/admin')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminDb = createAdminClient() as any

  // Get company for this user
  const { data: userRow } = await adminDb
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle()

  const companyId = (userRow as { company_id: string } | null)?.company_id

  if (!companyId) throw new Error('No company linked to this user')

  // Update company record with all details
  const { error } = await adminDb
    .from('companies')
    .update({
      name: values.company_name,
      workspace_name: values.workspace_name,
      industry: values.industry,
      gst_number: values.gst_number ?? null,
      phone: values.phone ?? null,
      address: values.address ?? null,
      timezone: values.timezone,
      setup_complete: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)

  if (error) throw new Error('Failed to update workspace: ' + error.message)

  // Seed system roles for the company (ignore errors — function is idempotent)
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('seed_system_roles', { p_company_id: companyId }).catch(() => {})

  // Ensure the current user is set to administrator
  await adminDb
    .from('users')
    .update({ role: 'administrator', status: 'active' })
    .eq('id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/workspace/setup')
}
