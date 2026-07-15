-- =============================================================================
-- VendorFlow — Fix user / company name display
-- Migration: 20240114000000_fix_user_names_and_display.sql
--
-- Problems fixed:
-- 1. handle_new_user sets companies.name = email when no company_name given.
--    After workspace setup, workspace_name is set, so the sidebar shows it
--    correctly. BUT before workspace setup the sidebar falls back to `name`
--    which is the raw email. We update the trigger to use a sensible default.
--
-- 2. users.full_name is sometimes set to the email (when full_name metadata
--    is empty). We ensure the TopNav always shows a proper display name.
--
-- 3. accept_collaboration_request needs to also create a vendor_users record
--    pointing to the CORRECT company (added null check for vendor_id).
--
-- 4. The vendor_companies RLS policy allows the owner to do SELECT but the
--    collab_requests_vendor policy uses vendor_user_id = auth.uid() for
--    INSERT. We add an explicit INSERT policy for vendor_companies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Update handle_new_user: use a clean fallback for company name
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
  v_full_name    TEXT;
BEGIN
  -- Resolve full name — prefer metadata, never fall back to email
  v_full_name := NULLIF(TRIM(coalesce(NEW.raw_user_meta_data->>'full_name', '')), '');

  -- Resolve company
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  IF v_company_id IS NULL THEN
    -- Create a new company for this user.
    -- Name: use company_name from metadata if available, otherwise a placeholder
    -- that the workspace setup wizard will replace later.
    -- We deliberately do NOT use the email as the name.
    INSERT INTO public.companies (name)
    VALUES (coalesce(
      NULLIF(TRIM(coalesce(NEW.raw_user_meta_data->>'company_name', '')), ''),
      'My Company'
    ))
    RETURNING id INTO v_company_id;
  END IF;

  -- Resolve role — admin inviteUserByEmail sets role_slug in data
  v_role := NULLIF(TRIM(coalesce(
    NEW.raw_user_meta_data->>'role_slug',  -- from admin.inviteUserByEmail data
    NEW.raw_user_meta_data->>'role',       -- from signUp options.data
    ''
  )), '');

  IF v_role IS NULL THEN
    -- Count existing active users in this company
    SELECT COUNT(*) INTO v_user_count
    FROM public.users
    WHERE company_id = v_company_id;

    IF v_user_count = 0 THEN
      -- First user for this company → administrator
      v_role := 'administrator';
    ELSE
      v_role := 'member';
    END IF;
  END IF;

  INSERT INTO public.users (id, company_id, full_name, email, role, status)
  VALUES (
    NEW.id,
    v_company_id,
    coalesce(v_full_name, 'User'),  -- never store the email as the name
    NEW.email,
    v_role,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
    SET
      company_id = EXCLUDED.company_id,
      role       = CASE WHEN public.users.role = 'member' THEN EXCLUDED.role ELSE public.users.role END,
      full_name  = CASE WHEN public.users.full_name = 'User' OR public.users.full_name IS NULL
                        THEN EXCLUDED.full_name
                        ELSE public.users.full_name END,
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
-- 2. Fix any existing users where full_name = email (clean up bad data)
-- ---------------------------------------------------------------------------
UPDATE public.users
SET full_name = 'User'
WHERE full_name = email;

-- ---------------------------------------------------------------------------
-- 3. Fix any companies whose name was set to an email address
--    (identifiable by the @ character)
-- ---------------------------------------------------------------------------
UPDATE public.companies
SET name = coalesce(workspace_name, 'My Company')
WHERE name LIKE '%@%';

-- ---------------------------------------------------------------------------
-- 4. Ensure vendor_companies has explicit INSERT policy
--    (the owner policy covers ALL but let's be explicit for clarity)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS vendor_companies_insert ON public.vendor_companies;
CREATE POLICY vendor_companies_insert ON public.vendor_companies
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Fix accept_collaboration_request to handle the case where the vendor
--    name (email) already exists as a vendor record — use email OR name match
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_collaboration_request(
  p_request_id  UUID,
  p_reviewed_by UUID
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req         RECORD;
  v_vc          RECORD;
  v_vendor_id   UUID;
  v_category    vendor_category;
BEGIN
  -- Load the request
  SELECT * INTO v_req
  FROM public.collaboration_requests
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Load vendor company profile
  SELECT * INTO v_vc
  FROM public.vendor_companies
  WHERE id = v_req.vendor_company_id;

  -- Map vendor_companies.industry (TEXT) → vendors.category (vendor_category enum)
  -- vendor_category enum values: software, hardware, services, consulting,
  --   logistics, marketing, finance, legal, other
  v_category := CASE lower(v_vc.industry)
    WHEN 'technology'     THEN 'software'::vendor_category
    WHEN 'software'       THEN 'software'::vendor_category
    WHEN 'hardware'       THEN 'hardware'::vendor_category
    WHEN 'logistics'      THEN 'logistics'::vendor_category
    WHEN 'finance'        THEN 'finance'::vendor_category
    WHEN 'consulting'     THEN 'consulting'::vendor_category
    WHEN 'marketing'      THEN 'marketing'::vendor_category
    WHEN 'legal'          THEN 'legal'::vendor_category
    WHEN 'services'       THEN 'services'::vendor_category
    ELSE 'other'::vendor_category
  END;

  -- Create vendor record in the company's vendor list if not already there
  INSERT INTO public.vendors (
    company_id, name, email, phone, website, address, status,
    category, description
  )
  VALUES (
    v_req.company_id,
    v_vc.company_name,
    v_vc.email,
    v_vc.phone,
    v_vc.website,
    v_vc.address,
    'active',
    v_category,
    v_vc.description
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_vendor_id;

  -- If vendor already existed (duplicate email or name), get the id
  IF v_vendor_id IS NULL THEN
    SELECT id INTO v_vendor_id
    FROM public.vendors
    WHERE company_id = v_req.company_id
      AND (email = v_vc.email OR name = v_vc.company_name)
    LIMIT 1;
  END IF;

  -- Link vendor_user to vendor record (only if we have a vendor_id)
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_users (
      user_id, vendor_id, company_id, role, email, full_name, is_primary
    )
    VALUES (
      v_req.vendor_user_id,
      v_vendor_id,
      v_req.company_id,
      'admin',
      v_vc.email,
      v_vc.contact_name,
      TRUE
    )
    ON CONFLICT (user_id, vendor_id) DO NOTHING;
  END IF;

  -- Mark request accepted
  UPDATE public.collaboration_requests
  SET
    status      = 'accepted',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    updated_at  = NOW()
  WHERE id = p_request_id;

  RETURN v_vendor_id;
END;
$$;

-- =============================================================================
-- END
-- =============================================================================
