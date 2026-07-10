-- =============================================================================
-- VendorFlow — Inventory & Stock Management
-- Migration: 20240107000000_inventory.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Product categories
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_categories (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_company ON public.product_categories(company_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Products / Product catalog
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id         UUID        REFERENCES public.product_categories(id) ON DELETE SET NULL,
  preferred_vendor_id UUID        REFERENCES public.vendors(id) ON DELETE SET NULL,
  name                TEXT        NOT NULL,
  sku                 TEXT        NOT NULL,
  description         TEXT,
  unit                TEXT        NOT NULL DEFAULT 'pcs',
  unit_cost           NUMERIC(12,2) NOT NULL DEFAULT 0,
  status              TEXT        NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','inactive','discontinued')),
  min_stock_level     NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_stock_level     NUMERIC(12,2),
  reorder_level       NUMERIC(12,2) NOT NULL DEFAULT 0,
  lead_time_days      INTEGER DEFAULT 0,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_company    ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category   ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status     ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_sku        ON public.products(company_id, sku);

-- ─────────────────────────────────────────────────────────────
-- 3. Warehouses
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.warehouses (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  code        TEXT        NOT NULL,
  address     TEXT,
  is_default  BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, code)
);

-- Only one default warehouse per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouses_default
  ON public.warehouses(company_id)
  WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_warehouses_company ON public.warehouses(company_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Inventory (stock levels per product + warehouse)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id          UUID        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id        UUID        NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity_on_hand    NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_reserved   NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity_available  NUMERIC(12,2) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  valuation           NUMERIC(14,2) NOT NULL DEFAULT 0,
  last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_product   ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON public.inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company   ON public.inventory(company_id);

-- Trigger: recalculate valuation and last_updated on quantity change
CREATE OR REPLACE FUNCTION public.update_inventory_valuation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.valuation := NEW.quantity_on_hand * (
    SELECT unit_cost FROM public.products WHERE id = NEW.product_id
  );
  NEW.last_updated := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_valuation ON public.inventory;
CREATE TRIGGER trg_inventory_valuation
  BEFORE INSERT OR UPDATE OF quantity_on_hand
  ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_inventory_valuation();

-- ─────────────────────────────────────────────────────────────
-- 5. Goods Received Notes (GRN)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grn (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  grn_number          TEXT        NOT NULL,
  purchase_order_id   UUID        REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  warehouse_id        UUID        NOT NULL REFERENCES public.warehouses(id),
  received_by         UUID        NOT NULL REFERENCES auth.users(id),
  received_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  status              TEXT        NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','completed','cancelled')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, grn_number)
);

CREATE INDEX IF NOT EXISTS idx_grn_company ON public.grn(company_id);
CREATE INDEX IF NOT EXISTS idx_grn_po      ON public.grn(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_status  ON public.grn(status);

-- GRN line items
CREATE TABLE IF NOT EXISTS public.grn_items (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  grn_id            UUID        NOT NULL REFERENCES public.grn(id) ON DELETE CASCADE,
  product_id        UUID        NOT NULL REFERENCES public.products(id),
  ordered_quantity  NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_cost         NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes             TEXT
);

CREATE INDEX IF NOT EXISTS idx_grn_items_grn     ON public.grn_items(grn_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_product ON public.grn_items(product_id);

-- Auto-generate GRN number (pattern: GRN-YYYY-NNNN)
CREATE OR REPLACE FUNCTION public.generate_grn_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_year  TEXT;
  v_seq   INT;
BEGIN
  IF NEW.grn_number IS NOT NULL AND NEW.grn_number <> '' THEN
    RETURN NEW;
  END IF;
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(grn_number, '^GRN-\d{4}-', ''), '')::INT
  ), 0) + 1
  INTO v_seq
  FROM public.grn
  WHERE company_id = NEW.company_id
    AND grn_number LIKE 'GRN-' || v_year || '-%';
  NEW.grn_number := 'GRN-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_grn_number ON public.grn;
CREATE TRIGGER trg_generate_grn_number
  BEFORE INSERT ON public.grn
  FOR EACH ROW EXECUTE FUNCTION public.generate_grn_number();

-- ─────────────────────────────────────────────────────────────
-- 6. Inventory transactions (audit trail)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id       UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id       UUID        NOT NULL REFERENCES public.products(id),
  warehouse_id     UUID        NOT NULL REFERENCES public.warehouses(id),
  transaction_type TEXT        NOT NULL
                   CHECK (transaction_type IN ('stock_in','stock_out','adjustment','grn','reservation','reservation_release')),
  quantity         NUMERIC(12,2) NOT NULL,
  quantity_before  NUMERIC(12,2) NOT NULL,
  quantity_after   NUMERIC(12,2) NOT NULL,
  reference_type   TEXT,
  reference_id     UUID,
  notes            TEXT,
  created_by       UUID        NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_company    ON public.inventory_transactions(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_tx_product    ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_warehouse  ON public.inventory_transactions(warehouse_id);

-- ─────────────────────────────────────────────────────────────
-- 7. updated_at triggers
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE TRIGGER trg_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_grn_updated_at
  BEFORE UPDATE ON public.grn
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 8. Row-Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.product_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn_items              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- product_categories
DROP POLICY IF EXISTS product_categories_select ON public.product_categories;
CREATE POLICY product_categories_select ON public.product_categories FOR SELECT USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS product_categories_insert ON public.product_categories;
CREATE POLICY product_categories_insert ON public.product_categories FOR INSERT WITH CHECK (company_id = public.current_company_id());
DROP POLICY IF EXISTS product_categories_update ON public.product_categories;
CREATE POLICY product_categories_update ON public.product_categories FOR UPDATE USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS product_categories_delete ON public.product_categories;
CREATE POLICY product_categories_delete ON public.product_categories FOR DELETE USING (company_id = public.current_company_id());

-- products
DROP POLICY IF EXISTS products_select ON public.products;
CREATE POLICY products_select ON public.products FOR SELECT USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS products_insert ON public.products;
CREATE POLICY products_insert ON public.products FOR INSERT WITH CHECK (company_id = public.current_company_id());
DROP POLICY IF EXISTS products_update ON public.products;
CREATE POLICY products_update ON public.products FOR UPDATE USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS products_delete ON public.products;
CREATE POLICY products_delete ON public.products FOR DELETE USING (company_id = public.current_company_id());

-- warehouses
DROP POLICY IF EXISTS warehouses_select ON public.warehouses;
CREATE POLICY warehouses_select ON public.warehouses FOR SELECT USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS warehouses_insert ON public.warehouses;
CREATE POLICY warehouses_insert ON public.warehouses FOR INSERT WITH CHECK (company_id = public.current_company_id());
DROP POLICY IF EXISTS warehouses_update ON public.warehouses;
CREATE POLICY warehouses_update ON public.warehouses FOR UPDATE USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS warehouses_delete ON public.warehouses;
CREATE POLICY warehouses_delete ON public.warehouses FOR DELETE USING (company_id = public.current_company_id());

-- inventory
DROP POLICY IF EXISTS inventory_select ON public.inventory;
CREATE POLICY inventory_select ON public.inventory FOR SELECT USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS inventory_insert ON public.inventory;
CREATE POLICY inventory_insert ON public.inventory FOR INSERT WITH CHECK (company_id = public.current_company_id());
DROP POLICY IF EXISTS inventory_update ON public.inventory;
CREATE POLICY inventory_update ON public.inventory FOR UPDATE USING (company_id = public.current_company_id());

-- grn
DROP POLICY IF EXISTS grn_select ON public.grn;
CREATE POLICY grn_select ON public.grn FOR SELECT USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS grn_insert ON public.grn;
CREATE POLICY grn_insert ON public.grn FOR INSERT WITH CHECK (company_id = public.current_company_id());
DROP POLICY IF EXISTS grn_update ON public.grn;
CREATE POLICY grn_update ON public.grn FOR UPDATE USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS grn_delete ON public.grn;
CREATE POLICY grn_delete ON public.grn FOR DELETE USING (company_id = public.current_company_id());

-- grn_items (scoped through grn)
DROP POLICY IF EXISTS grn_items_select ON public.grn_items;
CREATE POLICY grn_items_select ON public.grn_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.grn WHERE grn.id = grn_items.grn_id AND grn.company_id = public.current_company_id())
);
DROP POLICY IF EXISTS grn_items_insert ON public.grn_items;
CREATE POLICY grn_items_insert ON public.grn_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.grn WHERE grn.id = grn_items.grn_id AND grn.company_id = public.current_company_id())
);
DROP POLICY IF EXISTS grn_items_delete ON public.grn_items;
CREATE POLICY grn_items_delete ON public.grn_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.grn WHERE grn.id = grn_items.grn_id AND grn.company_id = public.current_company_id())
);

-- inventory_transactions
DROP POLICY IF EXISTS inv_tx_select ON public.inventory_transactions;
CREATE POLICY inv_tx_select ON public.inventory_transactions FOR SELECT USING (company_id = public.current_company_id());
DROP POLICY IF EXISTS inv_tx_insert ON public.inventory_transactions;
CREATE POLICY inv_tx_insert ON public.inventory_transactions FOR INSERT WITH CHECK (company_id = public.current_company_id());

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
