-- =============================================================================
-- VendorFlow — Vendor Self-Registration & Collaboration Requests
-- Migration: 20240112000000_vendor_self_registration.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. vendor_companies — vendor's own business profile
--    Created when a vendor self-registers through the Vendor Portal.
--    Separate from the `vendors` table (which is the company's vendor records).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_companies (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  company_name        TEXT        NOT NULL,
  contact_name        TEXT,
  email               TEXT        NOT NULL,
  phone               TEXT,
  website             TEXT,
  address             TEXT,
  industry            TEXT,
  gst_number          TEXT,
  description         TEXT,
  logo_url            TEXT,
  status              TEXT        NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','inactive','suspended')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_companies_user_id ON public.vendor_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_companies_email   ON public.vendor_companies(email);

CREATE OR REPLACE TRIGGER trg_vendor_companies_updated_at
  BEFORE UPDATE ON public.vendor_companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 2. collaboration_requests
--    Vendor discovers a company and sends a collaboration request.
--    Company can accept (→ creates vendors row) or reject.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_user_id  UUID        NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  vendor_company_id UUID      NOT NULL REFERENCES public.vendor_companies(id) ON DELETE CASCADE,
  company_id      UUID        NOT NULL REFERENCES public.companies(id)  ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  message         TEXT,               -- optional message from vendor
  rejection_reason TEXT,              -- optional reason from company
  reviewed_by     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One vendor can only have one active request per company
  UNIQUE (vendor_company_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_collab_requests_vendor    ON public.collaboration_requests(vendor_user_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_company   ON public.collaboration_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_status    ON public.collaboration_requests(status);

CREATE OR REPLACE TRIGGER trg_collab_requests_updated_at
  BEFORE UPDATE ON public.collaboration_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Function: when a collaboration request is accepted, automatically create
--    a vendors row in the company's vendor list.
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
    v_vc.industry,
    v_vc.description
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_vendor_id;

  -- If vendor already existed, get the id
  IF v_vendor_id IS NULL THEN
    SELECT id INTO v_vendor_id
    FROM public.vendors
    WHERE company_id = v_req.company_id AND email = v_vc.email
    LIMIT 1;
  END IF;

  -- Link vendor_user to vendor record
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_users (user_id, vendor_id, company_id, role, email, full_name, is_primary)
    VALUES (v_req.vendor_user_id, v_vendor_id, v_req.company_id, 'admin', v_vc.email, v_vc.contact_name, TRUE)
    ON CONFLICT (user_id, vendor_id) DO NOTHING;
  END IF;

  -- Mark request accepted
  UPDATE public.collaboration_requests
  SET status = 'accepted', reviewed_by = p_reviewed_by, reviewed_at = NOW(), updated_at = NOW()
  WHERE id = p_request_id;

  RETURN v_vendor_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- vendor_companies: vendor can manage their own; companies can read all active
DROP POLICY IF EXISTS vendor_companies_own ON public.vendor_companies;
CREATE POLICY vendor_companies_own ON public.vendor_companies
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS vendor_companies_company_read ON public.vendor_companies;
CREATE POLICY vendor_companies_company_read ON public.vendor_companies
  FOR SELECT USING (status = 'active');

-- collaboration_requests: vendor sees their own; company sees requests to them
DROP POLICY IF EXISTS collab_requests_vendor ON public.collaboration_requests;
CREATE POLICY collab_requests_vendor ON public.collaboration_requests
  FOR ALL USING (vendor_user_id = auth.uid());

DROP POLICY IF EXISTS collab_requests_company ON public.collaboration_requests;
CREATE POLICY collab_requests_company ON public.collaboration_requests
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS collab_requests_company_update ON public.collaboration_requests;
CREATE POLICY collab_requests_company_update ON public.collaboration_requests
  FOR UPDATE USING (company_id = public.current_company_id());

-- =============================================================================
-- END
-- =============================================================================
