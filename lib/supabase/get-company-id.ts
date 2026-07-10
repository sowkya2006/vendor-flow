/**
 * get-company-id.ts
 *
 * Re-exports the cached getCompanyId from get-auth.ts so all existing
 * imports (`@/lib/supabase/get-company-id`) continue to work without change.
 *
 * The actual implementation lives in get-auth.ts and is deduplicated
 * per server render using React cache().
 */
export { getCompanyId } from '@/lib/supabase/get-auth'
