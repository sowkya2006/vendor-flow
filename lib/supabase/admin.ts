import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/**
 * createAdminClient — uses the service_role key to bypass RLS.
 * ONLY use server-side in trusted server actions / API routes.
 * NEVER expose this to the client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add SUPABASE_SERVICE_ROLE_KEY to .env.local (never commit it).',
    )
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
