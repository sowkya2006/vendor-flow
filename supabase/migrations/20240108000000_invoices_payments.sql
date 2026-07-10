-- =============================================================================
-- VendorFlow — Invoice & Payment Management
-- Migration: 20240108000000_invoices_payments.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'draft', 'submitted', 'approved', 'partially_paid', 'paid', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'bank_transfer', 'upi', 'cheque', 'cash', 'card'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- TABLE: invoices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id                UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID            NOT NULL REFERENCES public.companies(id)       ON DELETE CASCADE,
  purchase_order_id UUID            REFERENCES public.purchase_orders(id)          ON DELETE SET NULL,
  vendor_id         UUID            NOT NULL REFERENCES public.vendors(id)         ON DELETE RESTRICT,
  invoice_number    TEXT            NOT NULL,
  invoice_date      DATE            NOT NULL DEFAULT CURRENT_DATE,
  due_date          DATE,
  status            invoice_status  NOT NULL DEFAULT 'draft',
  subtotal          NUMERIC(15,2)   NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(15,2)   NOT NULL DEFAULT 0,
  discount_amount   NUMERIC(15,2)   NOT NULL DEFAULT 0,
  total_amount      NUMERIC(15,2)   NOT NULL DEFAULT 0,
  paid_amount       NUMERIC(15,2)   NOT NULL DEFAULT 0,
  remaining_amount  NUMERIC(15,2)   GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  currency          CHAR(3)         NOT NULL DEFAULT 'INR',
  notes             TEXT,
  created_by        UUID            REFERENCES public.users(id)                   ON DELETE SET NULL,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_company_id        ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id         ON public.invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_purchase_order_id ON public.invoices(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status            ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date          ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at        ON public.invoices(created_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: invoice_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID          NOT NULL REFERENCES public.invoices(id)  ON DELETE CASCADE,
  product_id      UUID          REFERENCES public.products(id)           ON DELETE SET NULL,
  description     TEXT          NOT NULL,
  quantity        NUMERIC(15,4) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_percentage  NUMERIC(5,2)  NOT NULL DEFAULT 0,
  line_total      NUMERIC(15,2) GENERATED ALWAYS AS (
                    quantity * unit_price * (1 + tax_percentage / 100)
                  ) STORED,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON public.invoice_items(product_id);

-- ---------------------------------------------------------------------------
-- TABLE: payments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id          UUID            NOT NULL REFERENCES public.invoices(id)    ON DELETE RESTRICT,
  company_id          UUID            NOT NULL REFERENCES public.companies(id)   ON DELETE CASCADE,
  vendor_id           UUID            NOT NULL REFERENCES public.vendors(id)     ON DELETE RESTRICT,
  payment_reference   TEXT            NOT NULL,
  payment_date        DATE            NOT NULL DEFAULT CURRENT_DATE,
  payment_method      payment_method  NOT NULL DEFAULT 'bank_transfer',
  amount              NUMERIC(15,2)   NOT NULL CHECK (amount > 0),
  notes               TEXT,
  created_by          UUID            REFERENCES public.users(id)               ON DELETE SET NULL,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, payment_reference)
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id   ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_company_id   ON public.payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id    ON public.payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date DESC);

-- ---------------------------------------------------------------------------
-- FUNCTION: auto-generate invoice_number  →  INV-YYYY-NNNN
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_year TEXT;
  v_seq  INT;
BEGIN
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number <> '' THEN
    RETURN NEW;
  END IF;
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(invoice_number, '^INV-\d{4}-', ''), '')::INT
  ), 0) + 1
  INTO v_seq
  FROM public.invoices
  WHERE company_id = NEW.company_id
    AND invoice_number LIKE 'INV-' || v_year || '-%';
  NEW.invoice_number := 'INV-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_invoice_number ON public.invoices;
CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

-- ---------------------------------------------------------------------------
-- FUNCTION: auto-generate payment_reference  →  PAY-YYYY-NNNN
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_payment_reference()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_year TEXT;
  v_seq  INT;
BEGIN
  IF NEW.payment_reference IS NOT NULL AND NEW.payment_reference <> '' THEN
    RETURN NEW;
  END IF;
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(payment_reference, '^PAY-\d{4}-', ''), '')::INT
  ), 0) + 1
  INTO v_seq
  FROM public.payments
  WHERE company_id = NEW.company_id
    AND payment_reference LIKE 'PAY-' || v_year || '-%';
  NEW.payment_reference := 'PAY-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_payment_reference ON public.payments;
CREATE TRIGGER trg_generate_payment_reference
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.generate_payment_reference();

-- ---------------------------------------------------------------------------
-- FUNCTION: sync invoice totals from items
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_subtotal  NUMERIC(15,2);
  v_tax       NUMERIC(15,2);
  v_inv_id    UUID;
BEGIN
  v_inv_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

  SELECT
    COALESCE(SUM(quantity * unit_price), 0),
    COALESCE(SUM(quantity * unit_price * tax_percentage / 100), 0)
  INTO v_subtotal, v_tax
  FROM public.invoice_items
  WHERE invoice_id = v_inv_id;

  UPDATE public.invoices
  SET subtotal     = v_subtotal,
      tax_amount   = v_tax,
      total_amount = v_subtotal + v_tax - discount_amount,
      updated_at   = NOW()
  WHERE id = v_inv_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_invoice_totals_insert ON public.invoice_items;
CREATE TRIGGER trg_sync_invoice_totals_insert
  AFTER INSERT ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_totals();

DROP TRIGGER IF EXISTS trg_sync_invoice_totals_update ON public.invoice_items;
CREATE TRIGGER trg_sync_invoice_totals_update
  AFTER UPDATE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_totals();

DROP TRIGGER IF EXISTS trg_sync_invoice_totals_delete ON public.invoice_items;
CREATE TRIGGER trg_sync_invoice_totals_delete
  AFTER DELETE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_totals();

-- ---------------------------------------------------------------------------
-- FUNCTION: update paid_amount and status after a payment is inserted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_invoice_paid_amount()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_total_paid  NUMERIC(15,2);
  v_total_amt   NUMERIC(15,2);
  v_new_status  invoice_status;
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id;

  SELECT total_amount INTO v_total_amt
  FROM public.invoices
  WHERE id = NEW.invoice_id;

  IF v_total_paid <= 0 THEN
    v_new_status := 'approved';
  ELSIF v_total_paid >= v_total_amt THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partially_paid';
  END IF;

  UPDATE public.invoices
  SET paid_amount = v_total_paid,
      status      = v_new_status,
      updated_at  = NOW()
  WHERE id = NEW.invoice_id
    AND status NOT IN ('cancelled', 'draft', 'submitted');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_invoice_paid_amount ON public.payments;
CREATE TRIGGER trg_sync_invoice_paid_amount
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_paid_amount();

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments       ENABLE ROW LEVEL SECURITY;

-- ---- invoices ----
DROP POLICY IF EXISTS invoices_select ON public.invoices;
CREATE POLICY invoices_select ON public.invoices
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS invoices_insert ON public.invoices;
CREATE POLICY invoices_insert ON public.invoices
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS invoices_update ON public.invoices;
CREATE POLICY invoices_update ON public.invoices
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS invoices_delete ON public.invoices;
CREATE POLICY invoices_delete ON public.invoices
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- invoice_items ----
DROP POLICY IF EXISTS invoice_items_select ON public.invoice_items;
CREATE POLICY invoice_items_select ON public.invoice_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
              AND invoices.company_id = public.current_company_id())
  );

DROP POLICY IF EXISTS invoice_items_insert ON public.invoice_items;
CREATE POLICY invoice_items_insert ON public.invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
              AND invoices.company_id = public.current_company_id())
  );

DROP POLICY IF EXISTS invoice_items_update ON public.invoice_items;
CREATE POLICY invoice_items_update ON public.invoice_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
              AND invoices.company_id = public.current_company_id())
  );

DROP POLICY IF EXISTS invoice_items_delete ON public.invoice_items;
CREATE POLICY invoice_items_delete ON public.invoice_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
              AND invoices.company_id = public.current_company_id())
  );

-- ---- payments (insert-only; no update/delete) ----
DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS payments_insert ON public.payments;
CREATE POLICY payments_insert ON public.payments
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
