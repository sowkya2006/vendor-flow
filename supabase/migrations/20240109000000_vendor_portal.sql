-- =============================================================================
-- VendorFlow — Vendor Portal
-- Migration: 20240109000000_vendor_portal.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: vendor_users
-- Links auth.users to a specific vendor record.
-- A vendor employee logs in via Supabase Auth; this table maps them to
-- their vendor and stores their portal role.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_users (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  vendor_id   UUID        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL DEFAULT 'member'
              CHECK (role IN ('admin', 'member', 'viewer')),
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_users_user_id   ON public.vendor_users(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_users_vendor_id ON public.vendor_users(vendor_id);

CREATE OR REPLACE TRIGGER trg_vendor_users_updated_at
  BEFORE UPDATE ON public.vendor_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- TABLE: vendor_notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_notifications (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id   UUID        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,   -- 'new_rfq' | 'quotation_accepted' | 'po_issued' | ...
  title       TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  link        TEXT,                   -- e.g. '/vendor/rfqs/<id>'
  reference_id UUID,                  -- optional FK to the related record
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor ON public.vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_read   ON public.vendor_notifications(vendor_id, read);

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION: get current vendor_id from session
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_vendor_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT vendor_id FROM public.vendor_users WHERE user_id = auth.uid() LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- RLS: vendor_users
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vendor_users_self_select ON public.vendor_users;
CREATE POLICY vendor_users_self_select ON public.vendor_users
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS vendor_users_company_select ON public.vendor_users;
CREATE POLICY vendor_users_company_select ON public.vendor_users
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendor_users_self_update ON public.vendor_users;
CREATE POLICY vendor_users_self_update ON public.vendor_users
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS vendor_users_company_insert ON public.vendor_users;
CREATE POLICY vendor_users_company_insert ON public.vendor_users
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

-- ---------------------------------------------------------------------------
-- RLS: vendor_notifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vendor_notifications_vendor_select ON public.vendor_notifications;
CREATE POLICY vendor_notifications_vendor_select ON public.vendor_notifications
  FOR SELECT USING (vendor_id = public.current_vendor_id());

DROP POLICY IF EXISTS vendor_notifications_company_insert ON public.vendor_notifications;
CREATE POLICY vendor_notifications_company_insert ON public.vendor_notifications
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendor_notifications_vendor_update ON public.vendor_notifications;
CREATE POLICY vendor_notifications_vendor_update ON public.vendor_notifications
  FOR UPDATE USING (vendor_id = public.current_vendor_id());

-- ---------------------------------------------------------------------------
-- RLS ADDITIONS: let vendor users read their own data from existing tables
-- ---------------------------------------------------------------------------

-- vendors: vendor user can read their own vendor row
DROP POLICY IF EXISTS vendors_vendor_user_select ON public.vendors;
CREATE POLICY vendors_vendor_user_select ON public.vendors
  FOR SELECT USING (id = public.current_vendor_id());

DROP POLICY IF EXISTS vendors_vendor_user_update ON public.vendors;
CREATE POLICY vendors_vendor_user_update ON public.vendors
  FOR UPDATE USING (id = public.current_vendor_id());

-- rfqs: vendor can read RFQs where they are the assigned vendor
DROP POLICY IF EXISTS rfqs_vendor_select ON public.rfqs;
CREATE POLICY rfqs_vendor_select ON public.rfqs
  FOR SELECT USING (vendor_id = public.current_vendor_id());

-- quotations: vendor can read/write their own quotations
DROP POLICY IF EXISTS quotations_vendor_select ON public.quotations;
CREATE POLICY quotations_vendor_select ON public.quotations
  FOR SELECT USING (vendor_id = public.current_vendor_id());

DROP POLICY IF EXISTS quotations_vendor_insert ON public.quotations;
CREATE POLICY quotations_vendor_insert ON public.quotations
  FOR INSERT WITH CHECK (vendor_id = public.current_vendor_id());

DROP POLICY IF EXISTS quotations_vendor_update ON public.quotations;
CREATE POLICY quotations_vendor_update ON public.quotations
  FOR UPDATE USING (vendor_id = public.current_vendor_id());

-- purchase_orders: vendor can view POs addressed to them
DROP POLICY IF EXISTS purchase_orders_vendor_select ON public.purchase_orders;
CREATE POLICY purchase_orders_vendor_select ON public.purchase_orders
  FOR SELECT USING (vendor_id = public.current_vendor_id());

-- invoices: vendor can create and read their own invoices
DROP POLICY IF EXISTS invoices_vendor_select ON public.invoices;
CREATE POLICY invoices_vendor_select ON public.invoices
  FOR SELECT USING (vendor_id = public.current_vendor_id());

DROP POLICY IF EXISTS invoices_vendor_insert ON public.invoices;
CREATE POLICY invoices_vendor_insert ON public.invoices
  FOR INSERT WITH CHECK (vendor_id = public.current_vendor_id());

-- invoice_items: vendor can insert/read items for their invoices
DROP POLICY IF EXISTS invoice_items_vendor_select ON public.invoice_items;
CREATE POLICY invoice_items_vendor_select ON public.invoice_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
              AND invoices.vendor_id = public.current_vendor_id())
  );

DROP POLICY IF EXISTS invoice_items_vendor_insert ON public.invoice_items;
CREATE POLICY invoice_items_vendor_insert ON public.invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
              AND invoices.vendor_id = public.current_vendor_id())
  );

-- payments: vendor can view payments made to them
DROP POLICY IF EXISTS payments_vendor_select ON public.payments;
CREATE POLICY payments_vendor_select ON public.payments
  FOR SELECT USING (vendor_id = public.current_vendor_id());

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
