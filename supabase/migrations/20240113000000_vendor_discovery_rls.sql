-- =============================================================================
-- VendorFlow — Vendor Discovery RLS Fix
-- Migration: 20240113000000_vendor_discovery_rls.sql
--
-- Problem: self-registered vendors have no company_id, so current_company_id()
-- returns NULL and all RLS policies that use it block the vendor from reading
-- the companies table (needed for discovery).
--
-- Fix: add additional RLS policies so vendors can read public company data.
-- =============================================================================

-- Allow any authenticated user to read companies that have completed setup.
-- This is intentional — vendor discovery requires seeing company names.
DROP POLICY IF EXISTS companies_vendor_discovery ON public.companies;
CREATE POLICY companies_vendor_discovery ON public.companies
  FOR SELECT USING (
    setup_complete = TRUE
    AND auth.uid() IS NOT NULL
  );

-- Allow vendors to read collaboration_requests they are involved in
-- (already handled by vendor policy in 20240112, but ensure it exists)
DROP POLICY IF EXISTS collab_requests_vendor_read ON public.collaboration_requests;
CREATE POLICY collab_requests_vendor_read ON public.collaboration_requests
  FOR SELECT USING (vendor_user_id = auth.uid());

-- Allow vendors to insert their own collaboration requests
DROP POLICY IF EXISTS collab_requests_vendor_insert ON public.collaboration_requests;
CREATE POLICY collab_requests_vendor_insert ON public.collaboration_requests
  FOR INSERT WITH CHECK (vendor_user_id = auth.uid());

-- Allow vendors to update their own pending requests (for withdraw)
DROP POLICY IF EXISTS collab_requests_vendor_update ON public.collaboration_requests;
CREATE POLICY collab_requests_vendor_update ON public.collaboration_requests
  FOR UPDATE USING (vendor_user_id = auth.uid());

-- Allow vendor_companies owner to read/write their own record
DROP POLICY IF EXISTS vendor_companies_owner ON public.vendor_companies;
CREATE POLICY vendor_companies_owner ON public.vendor_companies
  FOR ALL USING (user_id = auth.uid());

-- =============================================================================
-- END
-- =============================================================================
