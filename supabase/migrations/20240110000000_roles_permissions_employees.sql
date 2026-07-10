-- =============================================================================
-- VendorFlow — Roles, Permissions, Employee Invitations, Workspace Settings
-- Migration: 20240110000000_roles_permissions_employees.sql
-- Additive only. Does NOT modify existing tables structurally.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend companies table with workspace / company-profile fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS workspace_name   TEXT,
  ADD COLUMN IF NOT EXISTS gst_number       TEXT,
  ADD COLUMN IF NOT EXISTS timezone         TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS industry         TEXT,
  ADD COLUMN IF NOT EXISTS phone            TEXT,
  ADD COLUMN IF NOT EXISTS address          TEXT,
  ADD COLUMN IF NOT EXISTS logo_url         TEXT,
  ADD COLUMN IF NOT EXISTS setup_complete   BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------------------
-- 2. Extend users table with employee-profile fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department    TEXT,
  ADD COLUMN IF NOT EXISTS designation   TEXT,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url    TEXT,
  ADD COLUMN IF NOT EXISTS status        TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','invited','suspended'));

-- Broaden the role column to include all portal roles
-- (existing CHECK constraint may exist — we add new values gracefully)
DO $$
BEGIN
  -- Drop old constraint if it only allows admin/member/viewer
  BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (
    role IN ('administrator','procurement_manager','procurement_officer',
             'warehouse_manager','finance_manager','vendor','member','admin','viewer')
  );

-- ---------------------------------------------------------------------------
-- 3. roles — named role definitions per company
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  description TEXT,
  is_system   BOOLEAN     NOT NULL DEFAULT FALSE,   -- system roles cannot be deleted
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_roles_company ON public.roles(company_id);

CREATE OR REPLACE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 4. permissions — available permission keys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT  NOT NULL UNIQUE,   -- e.g. 'manage_vendors', 'finance_access'
  label       TEXT  NOT NULL,
  group_name  TEXT  NOT NULL,          -- e.g. 'Procurement', 'Finance'
  description TEXT
);

-- Seed system permissions (idempotent)
INSERT INTO public.permissions (key, label, group_name, description) VALUES
  ('manage_vendors',          'Manage Vendors',          'Procurement', 'Create, edit, approve and deactivate vendors'),
  ('manage_products',         'Manage Products',         'Procurement', 'Create and manage product catalog'),
  ('manage_rfqs',             'Manage RFQs',             'Procurement', 'Create and send RFQs to vendors'),
  ('manage_quotations',       'Manage Quotations',       'Procurement', 'Evaluate and approve quotations'),
  ('manage_purchase_orders',  'Manage Purchase Orders',  'Procurement', 'Create and approve purchase orders'),
  ('manage_inventory',        'Manage Inventory',        'Operations',  'Manage stock levels, GRN, warehouses'),
  ('manage_invoices',         'Manage Invoices',         'Finance',     'Create and approve invoices'),
  ('manage_payments',         'Manage Payments',         'Finance',     'Record and view payments'),
  ('finance_access',          'Finance Access',          'Finance',     'View all finance dashboards'),
  ('approve_rfqs',            'Approve RFQs',            'Approvals',   'Approve or reject RFQ submissions'),
  ('approve_quotations',      'Approve Quotations',      'Approvals',   'Approve or reject quotations'),
  ('approve_purchase_orders', 'Approve Purchase Orders', 'Approvals',   'Approve or reject purchase orders'),
  ('view_reports',            'View Reports',            'Insights',    'Access analytics and reports'),
  ('export_data',             'Export Data',             'Insights',    'Export reports and data'),
  ('manage_employees',        'Manage Employees',        'System',      'Invite and manage employee accounts'),
  ('manage_roles',            'Manage Roles',            'System',      'Configure roles and permissions'),
  ('manage_settings',         'Manage Settings',         'System',      'Edit company and workspace settings')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. role_permissions — many-to-many: roles ↔ permissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id            UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id       UUID  NOT NULL REFERENCES public.roles(id)       ON DELETE CASCADE,
  permission_id UUID  NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);

-- ---------------------------------------------------------------------------
-- 6. user_roles — many-to-many: users ↔ roles (per company)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES public.users(id)    ON DELETE CASCADE,
  role_id     UUID        NOT NULL REFERENCES public.roles(id)    ON DELETE CASCADE,
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user    ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company ON public.user_roles(company_id);

-- ---------------------------------------------------------------------------
-- 7. employee_invitations — track pending invites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_invitations (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  full_name    TEXT,
  role_slug    TEXT        NOT NULL DEFAULT 'member',
  department   TEXT,
  designation  TEXT,
  token        TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by   UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  accepted_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, email)
);

CREATE INDEX IF NOT EXISTS idx_invitations_company ON public.employee_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token   ON public.employee_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email   ON public.employee_invitations(email);

-- ---------------------------------------------------------------------------
-- 8. Seed system roles for existing companies (idempotent helper function)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_system_roles(p_company_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  r_admin_id  UUID;
  r_pm_id     UUID;
  r_po_id     UUID;
  r_wm_id     UUID;
  r_fm_id     UUID;
BEGIN
  -- Administrator
  INSERT INTO public.roles (company_id, name, slug, description, is_system)
  VALUES (p_company_id, 'Administrator', 'administrator', 'Full system access', TRUE)
  ON CONFLICT (company_id, slug) DO NOTHING
  RETURNING id INTO r_admin_id;

  IF r_admin_id IS NULL THEN
    SELECT id INTO r_admin_id FROM public.roles WHERE company_id = p_company_id AND slug = 'administrator';
  END IF;

  -- Procurement Manager
  INSERT INTO public.roles (company_id, name, slug, description, is_system)
  VALUES (p_company_id, 'Procurement Manager', 'procurement_manager', 'Full procurement access', TRUE)
  ON CONFLICT (company_id, slug) DO NOTHING
  RETURNING id INTO r_pm_id;

  IF r_pm_id IS NULL THEN
    SELECT id INTO r_pm_id FROM public.roles WHERE company_id = p_company_id AND slug = 'procurement_manager';
  END IF;

  -- Procurement Officer
  INSERT INTO public.roles (company_id, name, slug, description, is_system)
  VALUES (p_company_id, 'Procurement Officer', 'procurement_officer', 'RFQs, quotations, POs', TRUE)
  ON CONFLICT (company_id, slug) DO NOTHING
  RETURNING id INTO r_po_id;

  IF r_po_id IS NULL THEN
    SELECT id INTO r_po_id FROM public.roles WHERE company_id = p_company_id AND slug = 'procurement_officer';
  END IF;

  -- Warehouse Manager
  INSERT INTO public.roles (company_id, name, slug, description, is_system)
  VALUES (p_company_id, 'Warehouse Manager', 'warehouse_manager', 'Inventory and warehouses', TRUE)
  ON CONFLICT (company_id, slug) DO NOTHING
  RETURNING id INTO r_wm_id;

  IF r_wm_id IS NULL THEN
    SELECT id INTO r_wm_id FROM public.roles WHERE company_id = p_company_id AND slug = 'warehouse_manager';
  END IF;

  -- Finance Manager
  INSERT INTO public.roles (company_id, name, slug, description, is_system)
  VALUES (p_company_id, 'Finance Manager', 'finance_manager', 'Finance and payments', TRUE)
  ON CONFLICT (company_id, slug) DO NOTHING
  RETURNING id INTO r_fm_id;

  IF r_fm_id IS NULL THEN
    SELECT id INTO r_fm_id FROM public.roles WHERE company_id = p_company_id AND slug = 'finance_manager';
  END IF;

  -- Grant administrator all permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_admin_id, id FROM public.permissions
  ON CONFLICT DO NOTHING;

  -- Grant procurement_manager relevant permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_pm_id, id FROM public.permissions
  WHERE key IN ('manage_vendors','manage_products','manage_rfqs','manage_quotations',
                'manage_purchase_orders','approve_rfqs','approve_quotations',
                'approve_purchase_orders','view_reports')
  ON CONFLICT DO NOTHING;

  -- Grant procurement_officer relevant permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_po_id, id FROM public.permissions
  WHERE key IN ('manage_rfqs','manage_quotations','manage_purchase_orders','view_reports')
  ON CONFLICT DO NOTHING;

  -- Grant warehouse_manager relevant permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_wm_id, id FROM public.permissions
  WHERE key IN ('manage_inventory','view_reports')
  ON CONFLICT DO NOTHING;

  -- Grant finance_manager relevant permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT r_fm_id, id FROM public.permissions
  WHERE key IN ('manage_invoices','manage_payments','finance_access','view_reports','export_data')
  ON CONFLICT DO NOTHING;
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;

-- roles: company members can read; only admins write (enforced in app layer)
DROP POLICY IF EXISTS roles_select ON public.roles;
CREATE POLICY roles_select ON public.roles
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS roles_insert ON public.roles;
CREATE POLICY roles_insert ON public.roles
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS roles_update ON public.roles;
CREATE POLICY roles_update ON public.roles
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS roles_delete ON public.roles;
CREATE POLICY roles_delete ON public.roles
  FOR DELETE USING (company_id = public.current_company_id() AND is_system = FALSE);

-- role_permissions: readable by company members
DROP POLICY IF EXISTS role_permissions_select ON public.role_permissions;
CREATE POLICY role_permissions_select ON public.role_permissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.company_id = public.current_company_id())
  );

DROP POLICY IF EXISTS role_permissions_write ON public.role_permissions;
CREATE POLICY role_permissions_write ON public.role_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.company_id = public.current_company_id())
  );

-- user_roles
DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS user_roles_write ON public.user_roles;
CREATE POLICY user_roles_write ON public.user_roles
  FOR ALL USING (company_id = public.current_company_id());

-- invitations
DROP POLICY IF EXISTS invitations_select ON public.employee_invitations;
CREATE POLICY invitations_select ON public.employee_invitations
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS invitations_write ON public.employee_invitations;
CREATE POLICY invitations_write ON public.employee_invitations
  FOR ALL USING (company_id = public.current_company_id());

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
