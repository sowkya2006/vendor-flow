-- =============================================================================
-- VendorFlow — Vendor Quotation Management
-- Migration: 20240104000000_quotations.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUM: quotation_status
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'shortlisted',
    'approved',
    'rejected',
    'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- TABLE: quotations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotations (
  id                UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID              NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rfq_id            UUID              NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id         UUID              NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,

  quotation_number  TEXT              NOT NULL,
  status            quotation_status  NOT NULL DEFAULT 'draft',

  -- Financials
  subtotal          NUMERIC(15,2)     NOT NULL DEFAULT 0,
  discount_type     TEXT              CHECK (discount_type IN ('percentage','fixed')) DEFAULT 'percentage',
  discount_value    NUMERIC(15,2)     NOT NULL DEFAULT 0,
  discount_amount   NUMERIC(15,2)     NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(15,2)     NOT NULL DEFAULT 0,
  grand_total       NUMERIC(15,2)     NOT NULL DEFAULT 0,

  -- Delivery & terms
  delivery_days     INTEGER,
  lead_time_days    INTEGER,
  warranty_months   INTEGER,
  payment_terms     TEXT,
  validity_date     DATE,

  -- Metadata
  notes             TEXT,
  rejection_reason  TEXT,

  submitted_at      TIMESTAMPTZ,
  reviewed_at       TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  rejected_at       TIMESTAMPTZ,

  created_by        UUID              REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by        UUID              REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  UNIQUE (company_id, quotation_number)
);

CREATE INDEX IF NOT EXISTS idx_quotations_company_id  ON public.quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_rfq_id      ON public.quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_vendor_id   ON public.quotations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status      ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at  ON public.quotations(created_at DESC);

COMMENT ON TABLE public.quotations IS 'Vendor quotations submitted in response to RFQs.';

-- ---------------------------------------------------------------------------
-- TABLE: quotation_items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id     UUID          NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  rfq_item_id      UUID          REFERENCES public.rfq_items(id) ON DELETE SET NULL,

  item_name        TEXT          NOT NULL,
  description      TEXT,
  part_number      TEXT,
  unit             TEXT          NOT NULL DEFAULT 'unit',

  quantity         NUMERIC(15,3) NOT NULL DEFAULT 1,
  unit_price       NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_pct     NUMERIC(5,2)  NOT NULL DEFAULT 0,
  discount_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_pct          NUMERIC(5,2)  NOT NULL DEFAULT 0,
  tax_amount       NUMERIC(15,2) NOT NULL DEFAULT 0,
  line_total       NUMERIC(15,2) NOT NULL DEFAULT 0,

  delivery_days    INTEGER,
  warranty_months  INTEGER,
  remarks          TEXT,
  sort_order       INTEGER       NOT NULL DEFAULT 0,

  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_rfq_item_id  ON public.quotation_items(rfq_item_id);

COMMENT ON TABLE public.quotation_items IS 'Line items for a vendor quotation.';

-- ---------------------------------------------------------------------------
-- TABLE: quotation_documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotation_documents (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id   UUID        NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  company_id     UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  file_name      TEXT        NOT NULL,
  file_url       TEXT        NOT NULL,
  file_type      TEXT,
  file_size      BIGINT,
  document_type  TEXT        NOT NULL DEFAULT 'quotation_pdf',

  uploaded_by    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_docs_quotation_id ON public.quotation_documents(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_docs_company_id   ON public.quotation_documents(company_id);

COMMENT ON TABLE public.quotation_documents IS 'Documents attached to a quotation (PDF, etc.).';

-- ---------------------------------------------------------------------------
-- TABLE: quotation_comments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotation_comments (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id   UUID        NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  company_id     UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  comment        TEXT        NOT NULL,
  is_internal    BOOLEAN     NOT NULL DEFAULT false,

  created_by     UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_cmts_quotation_id ON public.quotation_comments(quotation_id);

COMMENT ON TABLE public.quotation_comments IS 'Review comments on a quotation.';

-- ---------------------------------------------------------------------------
-- TABLE: quotation_history  (audit log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quotation_history (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id   UUID        NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  company_id     UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  action         TEXT        NOT NULL,
  old_values     JSONB,
  new_values     JSONB,
  notes          TEXT,

  performed_by   UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  performed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_hist_quotation_id ON public.quotation_history(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_hist_company_id   ON public.quotation_history(company_id);
CREATE INDEX IF NOT EXISTS idx_quotation_hist_performed_at ON public.quotation_history(performed_at DESC);

COMMENT ON TABLE public.quotation_history IS 'Immutable audit log for quotation state changes.';

-- ---------------------------------------------------------------------------
-- FUNCTION: generate_quotation_number
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_quotation_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year  TEXT;
  v_seq   INT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(quotation_number, '^QT-\d{4}-', ''), '')::INT
  ), 0) + 1
  INTO v_seq
  FROM public.quotations
  WHERE company_id = p_company_id
    AND quotation_number LIKE 'QT-' || v_year || '-%';
  RETURN 'QT-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$;

-- ---------------------------------------------------------------------------
-- FUNCTION: recalculate quotation_items line_total
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calc_quotation_item_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_discount NUMERIC(15,2);
  v_base     NUMERIC(15,2);
BEGIN
  v_base     := NEW.quantity * NEW.unit_price;
  v_discount := ROUND(v_base * NEW.discount_pct / 100, 2);
  NEW.discount_amount := v_discount;
  NEW.tax_amount      := ROUND((v_base - v_discount) * NEW.tax_pct / 100, 2);
  NEW.line_total      := v_base - v_discount + NEW.tax_amount;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_quotation_item_totals ON public.quotation_items;
CREATE TRIGGER trg_calc_quotation_item_totals
  BEFORE INSERT OR UPDATE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.calc_quotation_item_totals();

-- ---------------------------------------------------------------------------
-- FUNCTION: sync quotation grand_total after items change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_quotation_grand_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_qid       UUID;
  v_subtotal  NUMERIC(15,2);
  v_tax       NUMERIC(15,2);
  v_disc_type TEXT;
  v_disc_val  NUMERIC(15,2);
  v_disc_amt  NUMERIC(15,2);
BEGIN
  v_qid := COALESCE(NEW.quotation_id, OLD.quotation_id);

  SELECT
    COALESCE(SUM(quantity * unit_price - discount_amount), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO v_subtotal, v_tax
  FROM public.quotation_items
  WHERE quotation_id = v_qid;

  SELECT discount_type, discount_value
  INTO v_disc_type, v_disc_val
  FROM public.quotations WHERE id = v_qid;

  IF v_disc_type = 'percentage' THEN
    v_disc_amt := ROUND(v_subtotal * COALESCE(v_disc_val, 0) / 100, 2);
  ELSE
    v_disc_amt := COALESCE(v_disc_val, 0);
  END IF;

  UPDATE public.quotations
  SET
    subtotal        = v_subtotal,
    tax_amount      = v_tax,
    discount_amount = v_disc_amt,
    grand_total     = v_subtotal - v_disc_amt + v_tax,
    updated_at      = NOW()
  WHERE id = v_qid;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_quotation_total_insert ON public.quotation_items;
CREATE TRIGGER trg_sync_quotation_total_insert
  AFTER INSERT ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_quotation_grand_total();

DROP TRIGGER IF EXISTS trg_sync_quotation_total_update ON public.quotation_items;
CREATE TRIGGER trg_sync_quotation_total_update
  AFTER UPDATE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_quotation_grand_total();

DROP TRIGGER IF EXISTS trg_sync_quotation_total_delete ON public.quotation_items;
CREATE TRIGGER trg_sync_quotation_total_delete
  AFTER DELETE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_quotation_grand_total();

-- ---------------------------------------------------------------------------
-- updated_at triggers  (reuse the shared handle_updated_at function)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_quotation_items_updated_at
  BEFORE UPDATE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_quotation_comments_updated_at
  BEFORE UPDATE ON public.quotation_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.quotations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_history   ENABLE ROW LEVEL SECURITY;

-- ---- quotations ----
DROP POLICY IF EXISTS quotations_select ON public.quotations;
CREATE POLICY quotations_select ON public.quotations
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS quotations_insert ON public.quotations;
CREATE POLICY quotations_insert ON public.quotations
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS quotations_update ON public.quotations;
CREATE POLICY quotations_update ON public.quotations
  FOR UPDATE USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS quotations_delete ON public.quotations;
CREATE POLICY quotations_delete ON public.quotations
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- quotation_items (scoped through quotation) ----
DROP POLICY IF EXISTS quotation_items_select ON public.quotation_items;
CREATE POLICY quotation_items_select ON public.quotation_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotations
      WHERE quotations.id = quotation_items.quotation_id
        AND quotations.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS quotation_items_insert ON public.quotation_items;
CREATE POLICY quotation_items_insert ON public.quotation_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotations
      WHERE quotations.id = quotation_items.quotation_id
        AND quotations.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS quotation_items_update ON public.quotation_items;
CREATE POLICY quotation_items_update ON public.quotation_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quotations
      WHERE quotations.id = quotation_items.quotation_id
        AND quotations.company_id = public.current_company_id()
    )
  );

DROP POLICY IF EXISTS quotation_items_delete ON public.quotation_items;
CREATE POLICY quotation_items_delete ON public.quotation_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quotations
      WHERE quotations.id = quotation_items.quotation_id
        AND quotations.company_id = public.current_company_id()
    )
  );

-- ---- quotation_documents ----
DROP POLICY IF EXISTS quotation_docs_select ON public.quotation_documents;
CREATE POLICY quotation_docs_select ON public.quotation_documents
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS quotation_docs_insert ON public.quotation_documents;
CREATE POLICY quotation_docs_insert ON public.quotation_documents
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS quotation_docs_delete ON public.quotation_documents;
CREATE POLICY quotation_docs_delete ON public.quotation_documents
  FOR DELETE USING (company_id = public.current_company_id());

-- ---- quotation_comments ----
DROP POLICY IF EXISTS quotation_cmts_select ON public.quotation_comments;
CREATE POLICY quotation_cmts_select ON public.quotation_comments
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS quotation_cmts_insert ON public.quotation_comments;
CREATE POLICY quotation_cmts_insert ON public.quotation_comments
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS quotation_cmts_update ON public.quotation_comments;
CREATE POLICY quotation_cmts_update ON public.quotation_comments
  FOR UPDATE USING (
    created_by = auth.uid()
    AND company_id = public.current_company_id()
  );

DROP POLICY IF EXISTS quotation_cmts_delete ON public.quotation_comments;
CREATE POLICY quotation_cmts_delete ON public.quotation_comments
  FOR DELETE USING (
    created_by = auth.uid()
    AND company_id = public.current_company_id()
  );

-- ---- quotation_history (insert-only for members, no update/delete) ----
DROP POLICY IF EXISTS quotation_hist_select ON public.quotation_history;
CREATE POLICY quotation_hist_select ON public.quotation_history
  FOR SELECT USING (company_id = public.current_company_id());

DROP POLICY IF EXISTS quotation_hist_insert ON public.quotation_history;
CREATE POLICY quotation_hist_insert ON public.quotation_history
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
