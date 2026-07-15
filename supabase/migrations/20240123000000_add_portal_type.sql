-- =============================================================================
-- VendorFlow — Add portal_type to users table
-- Migration: 20240123000000_add_portal_type.sql
--
-- Purpose:
--   Add an explicit portal_type column ('company' | 'vendor') to the users
--   table so the middleware has a single, authoritative column to read when
--   deciding which portal to route a user to.
--
--   This eliminates the need for the middleware to cross-reference
--   vendor_users and vendor_companies tables, which was the root cause of
--   the misdirection bug.
--
-- Backfill rules:
--   - Any user with a non-null company_id → 'company'
--   - Any user with a null company_id     → 'vendor'  (ghost row for vendor)
-- =============================================================================

-- 1. Add the column (nullable during migration, then set NOT NULL with default)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS portal_type TEXT
  CHECK (portal_type IN ('company', 'vendor'))
  DEFAULT 'company';

-- 2. Backfill existing rows
UPDATE public.users
SET portal_type = CASE
  WHEN company_id IS NOT NULL THEN 'company'
  ELSE 'vendor'
END
WHERE portal_type IS NULL OR portal_type = 'company';  -- re-evaluate all rows

-- 3. Set NOT NULL now that every row has a value
ALTER TABLE public.users
  ALTER COLUMN portal_type SET NOT NULL;

ALTER TABLE public.users
  ALTER COLUMN portal_type SET DEFAULT 'company';

-- 4. Index for fast middleware lookups
CREATE INDEX IF NOT EXISTS idx_users_portal_type ON public.users(portal_type);
CREATE INDEX IF NOT EXISTS idx_users_id_portal   ON public.users(id, portal_type);

-- 5. Update handle_new_user to set portal_type correctly on insert
--    Company signup (has company_id metadata) → 'company'
--    Everything else → 'company' by default (vendor portal registers separately)
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
  v_portal_type  TEXT;
BEGIN
  -- Resolve company
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  IF v_company_id IS NULL THEN
    INSERT INTO public.companies (name)
    VALUES (coalesce(NEW.raw_user_meta_data->>'company_name', NEW.email, 'My Company'))
    RETURNING id INTO v_company_id;
  END IF;

  -- Resolve role
  v_role := coalesce(
    NEW.raw_user_meta_data->>'role_slug',
    NEW.raw_user_meta_data->>'role',
    ''
  );

  IF v_role = '' OR v_role IS NULL THEN
    SELECT COUNT(*) INTO v_user_count
    FROM public.users
    WHERE company_id = v_company_id;

    IF v_user_count = 0 THEN
      v_role := 'administrator';
    ELSE
      v_role := 'member';
    END IF;
  END IF;

  -- portal_type: always 'company' for users created via this trigger
  -- (vendor self-registration goes through a different path and does NOT
  --  create a row in public.users via this trigger)
  v_portal_type := 'company';

  INSERT INTO public.users (id, company_id, full_name, email, role, status, portal_type)
  VALUES (
    NEW.id,
    v_company_id,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    v_role,
    'active',
    v_portal_type
  )
  ON CONFLICT (id) DO UPDATE
    SET
      company_id  = EXCLUDED.company_id,
      role        = CASE
                      WHEN public.users.role = 'member' THEN EXCLUDED.role
                      ELSE public.users.role
                    END,
      full_name   = coalesce(EXCLUDED.full_name, public.users.full_name),
      email       = coalesce(EXCLUDED.email, public.users.email),
      status      = 'active',
      portal_type = 'company',   -- always company when a company_id exists
      updated_at  = NOW();

  RETURN NEW;
END;
$$;

-- Re-attach the trigger
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Relax the role check constraint to include all current slugs
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (
    role IN (
      'administrator', 'admin',
      'procurement_manager', 'procurement_officer',
      'warehouse_manager', 'finance_manager',
      'vendor', 'member', 'viewer', 'employee'
    )
  );

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
