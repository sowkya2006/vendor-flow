-- =============================================================================
-- VendorFlow — Fix handle_new_user trigger to skip vendor registrations
-- Migration: 20240126000000_fix_vendor_trigger.sql
--
-- ROOT CAUSE:
--   The handle_new_user() trigger fires on EVERY auth.users INSERT, including
--   vendor self-registrations. This creates a public.users row with a
--   company_id for vendors, causing get_user_portal() to return 'company'
--   for vendor accounts — the #1 cause of vendor→company mis-routing.
--
-- FIX:
--   Check raw_user_meta_data->>'is_vendor'. If true, SKIP the trigger entirely.
--   Vendor identity lives in vendor_companies/vendor_users, NOT public.users.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id   UUID;
  v_role         TEXT;
  v_user_count   INT;
BEGIN
  -- ── CRITICAL: Skip vendor registrations entirely ──────────────────────────
  -- Vendors authenticate through vendor_companies/vendor_users tables.
  -- Creating a public.users row for them causes get_user_portal() to
  -- classify them as company users, breaking all vendor authentication.
  IF (NEW.raw_user_meta_data->>'is_vendor')::BOOLEAN = TRUE THEN
    RETURN NEW;  -- do nothing for vendor accounts
  END IF;

  -- ── Company user: resolve or create company ───────────────────────────────
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  IF v_company_id IS NULL THEN
    -- New company signup — create a company record
    INSERT INTO public.companies (name)
    VALUES (coalesce(
      NEW.raw_user_meta_data->>'company_name',
      NEW.email,
      'My Company'
    ))
    RETURNING id INTO v_company_id;
  END IF;

  -- ── Resolve role ──────────────────────────────────────────────────────────
  v_role := coalesce(
    NEW.raw_user_meta_data->>'role_slug',
    NEW.raw_user_meta_data->>'role',
    ''
  );

  IF v_role = '' OR v_role IS NULL THEN
    -- First user in the company = administrator; all others = member
    SELECT COUNT(*) INTO v_user_count
    FROM public.users
    WHERE company_id = v_company_id;

    IF v_user_count = 0 THEN
      v_role := 'administrator';
    ELSE
      v_role := 'member';
    END IF;
  END IF;

  -- ── Insert/update public.users ────────────────────────────────────────────
  INSERT INTO public.users (
    id, company_id, full_name, email, role, status, portal_type
  )
  VALUES (
    NEW.id,
    v_company_id,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    v_role,
    'active',
    'company'
  )
  ON CONFLICT (id) DO UPDATE
    SET
      company_id  = EXCLUDED.company_id,
      role        = CASE
                      WHEN public.users.role IN ('member', 'viewer') THEN EXCLUDED.role
                      ELSE public.users.role
                    END,
      full_name   = coalesce(EXCLUDED.full_name, public.users.full_name),
      email       = coalesce(EXCLUDED.email, public.users.email),
      status      = 'active',
      portal_type = 'company',
      updated_at  = NOW();

  RETURN NEW;
END;
$$;

-- Re-attach trigger
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also update get_user_portal to be more robust
CREATE OR REPLACE FUNCTION public.get_user_portal(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id   UUID;
  v_role         TEXT;
  v_setup        BOOLEAN := false;
  v_vendor_user  UUID;
  v_vendor_co    UUID;
BEGIN
  -- Step 1: Check company users table
  -- ONLY consider a user as company if company_id IS NOT NULL
  -- A row in public.users without company_id is NOT a company user
  SELECT u.company_id, u.role, COALESCE(c.setup_complete, false)
  INTO   v_company_id, v_role, v_setup
  FROM   public.users u
  LEFT JOIN public.companies c ON c.id = u.company_id
  WHERE  u.id = p_user_id
    AND  u.company_id IS NOT NULL  -- explicit: must have a company
  LIMIT  1;

  IF v_company_id IS NOT NULL THEN
    RETURN json_build_object(
      'portal', 'company',
      'role',   COALESCE(v_role, 'viewer'),
      'setup',  v_setup
    );
  END IF;

  -- Step 2: Check vendor tables
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

  -- Step 3: Unknown user
  RETURN json_build_object('portal', null, 'role', null, 'setup', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_portal(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_portal(UUID) TO authenticated;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
