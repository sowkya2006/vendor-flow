-- =============================================================================
-- VendorFlow — get_user_portal() RPC function
-- Migration: 20240125000000_get_user_portal_fn.sql
--
-- Purpose:
--   Create a SECURITY DEFINER function that the middleware can call via RPC
--   to determine whether a user belongs to the company or vendor portal.
--
--   Because it is SECURITY DEFINER, it bypasses RLS entirely — no circular
--   dependency, no recursion, works for every user type.
--
--   The middleware calls this as:
--     POST /rest/v1/rpc/get_user_portal  { "p_user_id": "<uuid>" }
--
-- Returns JSON:
--   { "portal": "company", "role": "administrator", "setup": true }
--   { "portal": "vendor",  "role": "vendor",        "setup": true }
--   { "portal": null,      "role": null,             "setup": false }
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_portal(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER                   -- bypasses ALL RLS policies
SET search_path = public
AS $$
DECLARE
  v_company_id   UUID;
  v_role         TEXT;
  v_setup        BOOLEAN := false;
  v_vendor_user  UUID;
  v_vendor_co    UUID;
BEGIN
  -- ── Step 1: Check company users table ─────────────────────────────────
  SELECT u.company_id, u.role, COALESCE(c.setup_complete, false)
  INTO   v_company_id, v_role, v_setup
  FROM   public.users u
  LEFT JOIN public.companies c ON c.id = u.company_id
  WHERE  u.id = p_user_id
  LIMIT  1;

  -- If company_id is present → company user (FULL STOP, never check vendor)
  IF v_company_id IS NOT NULL THEN
    RETURN json_build_object(
      'portal', 'company',
      'role',   COALESCE(v_role, 'viewer'),
      'setup',  v_setup
    );
  END IF;

  -- ── Step 2: Check vendor tables (only when no company row found) ───────
  SELECT id INTO v_vendor_user
  FROM   public.vendor_users
  WHERE  user_id = p_user_id
  LIMIT  1;

  IF v_vendor_user IS NOT NULL THEN
    RETURN json_build_object('portal', 'vendor', 'role', 'vendor', 'setup', true);
  END IF;

  SELECT id INTO v_vendor_co
  FROM   public.vendor_companies
  WHERE  user_id = p_user_id
  LIMIT  1;

  IF v_vendor_co IS NOT NULL THEN
    RETURN json_build_object('portal', 'vendor', 'role', 'vendor', 'setup', true);
  END IF;

  -- ── Step 3: Unknown user ───────────────────────────────────────────────
  RETURN json_build_object('portal', null, 'role', null, 'setup', false);
END;
$$;

-- Grant execute to anon and authenticated so the middleware (using anon key)
-- can call it via REST RPC
GRANT EXECUTE ON FUNCTION public.get_user_portal(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_portal(UUID) TO authenticated;

-- Also fix current_company_id() while we're here
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- Fix the circular RLS policy on users
DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_select_company ON public.users;

CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY users_select_company ON public.users
  FOR SELECT USING (company_id = public.current_company_id());

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
