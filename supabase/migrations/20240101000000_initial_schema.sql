-- =============================================================================
-- VendorFlow Initial Schema Migration
-- =============================================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Execute the entire file at once.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE vendor_status AS ENUM ('active', 'inactive', 'pending', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vendor_category AS ENUM (
    'software', 'hardware', 'services', 'consulting',
    'logistics', 'marketing', 'finance', 'legal', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contract_type AS ENUM ('fixed', 'time_and_materials', 'retainer', 'milestone', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_terms AS ENUM ('net_15', 'net_30', 'net_45', 'net_60', 'net_90', 'immediate', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'contract', 'nda', 'sow', 'invoice', 'insurance',
    'compliance', 'certificate', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- TABLE: companies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  domain        TEXT        UNIQUE,
  logo_url      TEXT,
  address       TEXT,
  phone         TEXT,
  website       TEXT,
  industry      TEXT,
  size          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.companies IS 'Tenant organisations that use VendorFlow.';

-- ---------------------------------------------------------------------------
-- TABLE: users
-- (mirrors auth.users; extended profile data lives here)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name     TEXT,
  email         TEXT,
  role          TEXT        NOT NULL DEFAULT 'member',  -- 'admin' | 'member' | 'viewer'
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

COMMENT ON TABLE public.users IS 'Extended profiles for authenticated users, linked to a company.';

-- ---------------------------------------------------------------------------
-- TABLE: categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  description   TEXT,
  color         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_categories_company_id ON public.categories(company_id);

-- ---------------------------------------------------------------------------
-- TABLE: vendors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendors (
  id                    UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id            UUID            NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name                  TEXT            NOT NULL,
  legal_name            TEXT,
  email                 TEXT,
  phone                 TEXT,
  website               TEXT,
  address               TEXT,
  category              vendor_category,
  status                vendor_status   NOT NULL DEFAULT 'pending',
  tax_id                TEXT,
  registration_number   TEXT,
  description           TEXT,
  notes                 TEXT,
  -- contract & financial
  contract_start_date   DATE,
  contract_end_date     DATE,
  contract_value        NUMERIC(15, 2),
  contract_type         contract_type,
  payment_terms         payment_terms,
  currency              CHAR(3)         DEFAULT 'USD',
  -- metadata
  created_by            UUID            REFERENCES public.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendors_company_id   ON public.vendors(company_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status       ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category     ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_created_by   ON public.vendors(created_by);
CREATE INDEX IF NOT EXISTS idx_vendors_fts ON public.vendors
  USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

COMMENT ON TABLE public.vendors IS 'Vendor records scoped to a company.';

-- ---------------------------------------------------------------------------
-- TABLE: vendor_contacts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_contacts (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id     UUID        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_id    UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name    TEXT        NOT NULL,
  last_name     TEXT,
  title         TEXT,
  email         TEXT,
  phone         TEXT,
  is_primary    BOOLEAN     NOT NULL DEFAULT FALSE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor_id   ON public.vendor_contacts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_company_id  ON public.vendor_contacts(company_id);

-- ---------------------------------------------------------------------------
-- TABLE: vendor_documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id       UUID            NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_id      UUID            NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  uploaded_by     UUID            REFERENCES public.users(id) ON DELETE SET NULL,
  name            TEXT            NOT NULL,
  document_type   document_type   NOT NULL DEFAULT 'other',
  storage_path    TEXT            NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  expiry_date     DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_documents_vendor_id   ON public.vendor_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_company_id  ON public.vendor_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_vendor_documents_uploaded_by ON public.vendor_documents(uploaded_by);

-- ---------------------------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_vendor_contacts_updated_at
  BEFORE UPDATE ON public.vendor_contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_vendor_documents_updated_at
  BEFORE UPDATE ON public.vendor_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION: auto-insert users row from auth.users on sign-up
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::UUID;

  IF v_company_id IS NULL THEN
    INSERT INTO public.companies (name)
    VALUES (coalesce(NEW.raw_user_meta_data->>'company_name', NEW.email, 'My Company'))
    RETURNING id INTO v_company_id;
  END IF;

  INSERT INTO public.users (id, company_id, full_name, email, role)
  VALUES (
    NEW.id,
    v_company_id,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'role', 'member')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_contacts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_documents  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- ---- companies ----
DROP POLICY IF EXISTS companies_select ON public.companies;
CREATE POLICY companies_select ON public.companies
  FOR SELECT USING (id = public.current_company_id());

DROP POLICY IF EXISTS companies_update ON public.companies;
CREATE POLICY companies_update ON public.companies
  FOR UPDATE USING (id = public.current_company_id());

-- ---- users ----
DROP POLICY IF EXISTS users_select ON public.users;
CREATE POLICY users_select ON public.users
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS users_insert ON public.users;
CREATE POLICY users_insert ON public.users
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS users_update ON public.users;
CREATE POLICY users_update ON public.users
  FOR UPDATE USING (id = auth.uid());

-- ---- categories ----
DROP POLICY IF EXISTS categories_select ON public.categories;
CREATE POLICY categories_select ON public.categories
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS categories_insert ON public.categories;
CREATE POLICY categories_insert ON public.categories
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS categories_update ON public.categories;
CREATE POLICY categories_update ON public.categories
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS categories_delete ON public.categories;
CREATE POLICY categories_delete ON public.categories
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- vendors ----
DROP POLICY IF EXISTS vendors_select ON public.vendors;
CREATE POLICY vendors_select ON public.vendors
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendors_insert ON public.vendors;
CREATE POLICY vendors_insert ON public.vendors
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendors_update ON public.vendors;
CREATE POLICY vendors_update ON public.vendors
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendors_delete ON public.vendors;
CREATE POLICY vendors_delete ON public.vendors
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- vendor_contacts ----
DROP POLICY IF EXISTS vendor_contacts_select ON public.vendor_contacts;
CREATE POLICY vendor_contacts_select ON public.vendor_contacts
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendor_contacts_insert ON public.vendor_contacts;
CREATE POLICY vendor_contacts_insert ON public.vendor_contacts
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendor_contacts_update ON public.vendor_contacts;
CREATE POLICY vendor_contacts_update ON public.vendor_contacts
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendor_contacts_delete ON public.vendor_contacts;
CREATE POLICY vendor_contacts_delete ON public.vendor_contacts
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- vendor_documents ----
DROP POLICY IF EXISTS vendor_documents_select ON public.vendor_documents;
CREATE POLICY vendor_documents_select ON public.vendor_documents
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendor_documents_insert ON public.vendor_documents;
CREATE POLICY vendor_documents_insert ON public.vendor_documents
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendor_documents_update ON public.vendor_documents;
CREATE POLICY vendor_documents_update ON public.vendor_documents
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS vendor_documents_delete ON public.vendor_documents;
CREATE POLICY vendor_documents_delete ON public.vendor_documents
  FOR DELETE USING (company_id = public.current_company_id());

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
