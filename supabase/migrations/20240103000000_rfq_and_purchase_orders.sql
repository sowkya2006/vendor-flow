-- =============================================================================
-- VendorFlow — RFQ & Purchase Orders Schema
-- Migration: 20240103000000_rfq_and_purchase_orders.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE rfq_status AS ENUM ('draft', 'sent', 'under_review', 'awarded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rfq_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE po_status AS ENUM (
    'draft', 'pending_approval', 'approved', 'sent',
    'acknowledged', 'in_progress', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- TABLE: rfqs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rfqs (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id    UUID          NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title         TEXT          NOT NULL,
  description   TEXT,
  vendor_id     UUID          NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  status        rfq_status    NOT NULL DEFAULT 'draft',
  priority      rfq_priority  NOT NULL DEFAULT 'medium',
  due_date      DATE,
  terms         TEXT,
  created_by    UUID          REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfqs_company_id   ON public.rfqs(company_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_vendor_id    ON public.rfqs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status       ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_priority     ON public.rfqs(priority);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_by   ON public.rfqs(created_by);
CREATE INDEX IF NOT EXISTS idx_rfqs_due_date     ON public.rfqs(due_date);
CREATE INDEX IF NOT EXISTS idx_rfqs_fts ON public.rfqs
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

COMMENT ON TABLE public.rfqs IS 'Requests for Quotation scoped to a company.';

-- ---------------------------------------------------------------------------
-- TABLE: rfq_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rfq_items (
  id                    UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id                UUID          NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  description           TEXT          NOT NULL,
  quantity              NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit                  TEXT          NOT NULL DEFAULT 'unit',
  estimated_unit_price  NUMERIC(15,2),
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id ON public.rfq_items(rfq_id);

COMMENT ON TABLE public.rfq_items IS 'Line items for an RFQ.';

-- ---------------------------------------------------------------------------
-- TABLE: purchase_orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  po_number         TEXT        NOT NULL,
  vendor_id         UUID        NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  rfq_id            UUID        REFERENCES public.rfqs(id) ON DELETE SET NULL,
  status            po_status   NOT NULL DEFAULT 'draft',
  total_amount      NUMERIC(15,2),
  due_date          DATE,
  shipping_address  TEXT,
  billing_address   TEXT,
  payment_terms     TEXT,
  notes             TEXT,
  created_by        UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, po_number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_id ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id  ON public.purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_rfq_id     ON public.purchase_orders(rfq_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status     ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON public.purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_due_date   ON public.purchase_orders(due_date);

COMMENT ON TABLE public.purchase_orders IS 'Purchase orders scoped to a company.';

-- ---------------------------------------------------------------------------
-- TABLE: purchase_order_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id   UUID          NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  description         TEXT          NOT NULL,
  quantity            NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit                TEXT          NOT NULL DEFAULT 'unit',
  unit_price          NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_price         NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_items_purchase_order_id
  ON public.purchase_order_items(purchase_order_id);

COMMENT ON TABLE public.purchase_order_items IS 'Line items for a purchase order.';

-- ---------------------------------------------------------------------------
-- FUNCTION: auto-generate po_number before insert
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_year    TEXT;
  v_seq     INT;
  v_po_num  TEXT;
BEGIN
  IF NEW.po_number IS NOT NULL AND NEW.po_number <> '' THEN
    RETURN NEW;
  END IF;

  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(po_number, '^PO-\d{4}-', ''), '')::INT
  ), 0) + 1
  INTO v_seq
  FROM public.purchase_orders
  WHERE company_id = NEW.company_id
    AND po_number LIKE 'PO-' || v_year || '-%';

  NEW.po_number := 'PO-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_po_number ON public.purchase_orders;
CREATE TRIGGER trg_generate_po_number
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_po_number();

-- ---------------------------------------------------------------------------
-- FUNCTION: recompute purchase_order total_amount after items change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_po_total_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM public.purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_po_total_after_insert ON public.purchase_order_items;
CREATE TRIGGER trg_sync_po_total_after_insert
  AFTER INSERT ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_po_total_amount();

DROP TRIGGER IF EXISTS trg_sync_po_total_after_update ON public.purchase_order_items;
CREATE TRIGGER trg_sync_po_total_after_update
  AFTER UPDATE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_po_total_amount();

DROP TRIGGER IF EXISTS trg_sync_po_total_after_delete ON public.purchase_order_items;
CREATE TRIGGER trg_sync_po_total_after_delete
  AFTER DELETE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_po_total_amount();

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_rfqs_updated_at
  BEFORE UPDATE ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.rfqs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items  ENABLE ROW LEVEL SECURITY;

-- ---- rfqs ----
DROP POLICY IF EXISTS rfqs_select ON public.rfqs;
CREATE POLICY rfqs_select ON public.rfqs
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS rfqs_insert ON public.rfqs;
CREATE POLICY rfqs_insert ON public.rfqs
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS rfqs_update ON public.rfqs;
CREATE POLICY rfqs_update ON public.rfqs
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS rfqs_delete ON public.rfqs;
CREATE POLICY rfqs_delete ON public.rfqs
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- rfq_items (scoped through rfq) ----
DROP POLICY IF EXISTS rfq_items_select ON public.rfq_items;
CREATE POLICY rfq_items_select ON public.rfq_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_items.rfq_id
        AND rfqs.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS rfq_items_insert ON public.rfq_items;
CREATE POLICY rfq_items_insert ON public.rfq_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_items.rfq_id
        AND rfqs.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS rfq_items_update ON public.rfq_items;
CREATE POLICY rfq_items_update ON public.rfq_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_items.rfq_id
        AND rfqs.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS rfq_items_delete ON public.rfq_items;
CREATE POLICY rfq_items_delete ON public.rfq_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.rfqs
      WHERE rfqs.id = rfq_items.rfq_id
        AND rfqs.company_id = public.current_company_id()
    )
  );

-- ---- purchase_orders ----
DROP POLICY IF EXISTS purchase_orders_select ON public.purchase_orders;
CREATE POLICY purchase_orders_select ON public.purchase_orders
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS purchase_orders_insert ON public.purchase_orders;
CREATE POLICY purchase_orders_insert ON public.purchase_orders
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS purchase_orders_update ON public.purchase_orders;
CREATE POLICY purchase_orders_update ON public.purchase_orders
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS purchase_orders_delete ON public.purchase_orders;
CREATE POLICY purchase_orders_delete ON public.purchase_orders
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- purchase_order_items (scoped through purchase_orders) ----
DROP POLICY IF EXISTS po_items_select ON public.purchase_order_items;
CREATE POLICY po_items_select ON public.purchase_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
        AND purchase_orders.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS po_items_insert ON public.purchase_order_items;
CREATE POLICY po_items_insert ON public.purchase_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
        AND purchase_orders.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS po_items_update ON public.purchase_order_items;
CREATE POLICY po_items_update ON public.purchase_order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
        AND purchase_orders.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS po_items_delete ON public.purchase_order_items;
CREATE POLICY po_items_delete ON public.purchase_order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders
      WHERE purchase_orders.id = purchase_order_items.purchase_order_id
        AND purchase_orders.company_id = public.current_company_id()
    )
  );

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
