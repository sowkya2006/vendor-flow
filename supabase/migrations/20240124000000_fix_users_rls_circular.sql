-- =============================================================================
-- VendorFlow — Fix circular RLS on public.users
-- Migration: 20240124000000_fix_users_rls_circular.sql
--
-- ROOT CAUSE:
--   The SELECT policy on public.users was:
--     USING (company_id = public.current_company_id())
--
--   And current_company_id() is:
--     SELECT company_id FROM public.users WHERE id = auth.uid()
--
--   This is CIRCULAR: reading users → calls current_company_id() →
--   reads users again → calls current_company_id() → ...
--
--   PostgreSQL detects the recursion and returns NULL/empty, so the middleware
--   (and any server-side code) that queries public.users gets zero rows back.
--   This causes every user to fall through to the vendor portal check.
--
-- FIX:
--   Replace the circular SELECT policy with a non-recursive one:
--     - Each user can read their own row: id = auth.uid()
--     - Each user can read rows in their company: company_id = current_company_id()
--       BUT this is only safe because current_company_id() is now only called
--       AFTER auth.uid() is resolved, avoiding the self-reference loop.
--
--   The simplest and safest fix: allow SELECT on own row by id = auth.uid().
--   This is non-recursive and always works.
-- =============================================================================

-- ── Fix users SELECT policy (remove circular dependency) ───────────────────
DROP POLICY IF EXISTS users_select ON public.users;

-- Policy 1: Each user can always read their own row (non-recursive, by PK)
-- Policy 2: Users can read colleagues in the same company
-- We use two separate policies so auth.uid() short-circuits before
-- current_company_id() is ever needed for own-row reads.

-- Own row — non-recursive, direct PK match
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (id = auth.uid());

-- Colleagues — only triggered when reading other users
-- current_company_id() is safe here because own-row reads go via the
-- users_select_own policy first and never reach this one for self-reads.
CREATE POLICY users_select_company ON public.users
  FOR SELECT USING (company_id = public.current_company_id());

-- ── Fix current_company_id() to be explicitly non-recursive ────────────────
-- Use SECURITY DEFINER so it bypasses RLS entirely when reading users.
-- This breaks the recursion completely.
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER                        -- bypass RLS to avoid recursion
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ── Also fix the getAuthUser helper used in server actions ──────────────────
-- Some server actions call getAuthUser() from lib/supabase/get-auth.ts
-- which reads from public.users. With the circular RLS fixed this will
-- now work correctly.

-- ── Verify the fix works with a simple test ────────────────────────────────
-- (This is a comment — run manually in SQL editor if you want to verify:)
-- SELECT current_company_id();   -- Should return your company UUID, not NULL

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
