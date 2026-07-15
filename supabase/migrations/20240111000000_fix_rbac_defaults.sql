-- =============================================================================
-- VendorFlow — Fix RBAC defaults
-- Migration: 20240111000000_fix_rbac_defaults.sql
-- 
-- 1. Fix handle_new_user: first signup gets 'administrator', 
--    invited users get their role from metadata.
-- 2. Relax the role CHECK constraint to accept all enterprise slugs.
-- 3. Update any existing 'admin' rows to 'administrator'.
-- 4. Mark the first user per company as administrator.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop old role check constraint and add the full set
-- ---------------------------------------------------------------------------
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (
    role IN (
      'administrator',
      'procurement_manager',
      'procurement_officer',
      'warehouse_manager',
      'finance_manager',
      'vendor',
      'member',
      'admin',
      'viewer'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Migrate existing legacy roles
-- ---------------------------------------------------------------------------
UPDATE public.users SET role = 'administrator' WHERE role = 'admin';

-- ---------------------------------------------------------------------------
-- 3. Fix handle_new_user:
--    - If role is provided in metadata → use it
--    - If this is the first user for their company → administrator
--    - Otherwise → member
-- ---------------------------------------------------------------------------
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
  -- Resolve company
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  IF v_company_id IS NULL THEN
    INSERT INTO public.companies (name)
    VALUES (coalesce(NEW.raw_user_meta_data->>'company_name', NEW.email, 'My Company'))
    RETURNING id INTO v_company_id;
  END IF;

  -- Resolve role — admin inviteUserByEmail sets role_slug in data
  v_role := coalesce(
    NEW.raw_user_meta_data->>'role_slug',  -- from admin.inviteUserByEmail data
    NEW.raw_user_meta_data->>'role',       -- from signUp options.data
    ''
  );

  IF v_role = '' OR v_role IS NULL THEN
    -- Count existing active users in this company
    SELECT COUNT(*) INTO v_user_count
    FROM public.users
    WHERE company_id = v_company_id;

    IF v_user_count = 0 THEN
      -- First user → administrator
      v_role := 'administrator';
    ELSE
      v_role := 'member';
    END IF;
  END IF;

  INSERT INTO public.users (id, company_id, full_name, email, role, status)
  VALUES (
    NEW.id,
    v_company_id,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    v_role,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
    SET
      company_id = EXCLUDED.company_id,
      role       = CASE WHEN public.users.role = 'member' THEN EXCLUDED.role ELSE public.users.role END,
      full_name  = coalesce(EXCLUDED.full_name, public.users.full_name),
      email      = coalesce(EXCLUDED.email, public.users.email),
      status     = 'active',
      updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Re-attach the trigger (idempotent)
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Ensure every company has exactly one administrator
--    (promote the earliest user if none exists)
-- ---------------------------------------------------------------------------
WITH first_users AS (
  SELECT DISTINCT ON (company_id)
    id, company_id
  FROM public.users
  ORDER BY company_id, created_at ASC
),
companies_without_admin AS (
  SELECT fu.id
  FROM first_users fu
  WHERE NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE company_id = fu.company_id
      AND role = 'administrator'
  )
)
UPDATE public.users
SET role = 'administrator'
WHERE id IN (SELECT id FROM companies_without_admin);

-- =============================================================================
-- END
-- =============================================================================
