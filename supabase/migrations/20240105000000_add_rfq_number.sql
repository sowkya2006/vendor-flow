-- =============================================================================
-- VendorFlow — Add rfq_number to rfqs table
-- Migration: 20240105000000_add_rfq_number.sql
--
-- The rfqs table was created without a rfq_number column.
-- This migration adds the column, back-fills existing rows, adds a
-- uniqueness constraint, and installs a BEFORE INSERT trigger so every
-- new RFQ gets an auto-generated number (RFQ-YYYY-NNNN).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add the column (nullable first so the back-fill can run)
-- ---------------------------------------------------------------------------
ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS rfq_number TEXT;

-- ---------------------------------------------------------------------------
-- 2. Back-fill existing rows
--    Each row gets RFQ-{YYYY}-{zero-padded sequence within that company+year}
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  v_year TEXT;
  v_seq  INT;
BEGIN
  FOR r IN
    SELECT id, company_id, created_at
    FROM public.rfqs
    WHERE rfq_number IS NULL
    ORDER BY company_id, created_at
  LOOP
    v_year := TO_CHAR(r.created_at, 'YYYY');

    SELECT COALESCE(MAX(
      NULLIF(REGEXP_REPLACE(rfq_number, '^RFQ-\d{4}-', ''), '')::INT
    ), 0) + 1
    INTO v_seq
    FROM public.rfqs
    WHERE company_id = r.company_id
      AND rfq_number LIKE 'RFQ-' || v_year || '-%';

    UPDATE public.rfqs
    SET rfq_number = 'RFQ-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0')
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Set NOT NULL now that every row has a value
-- ---------------------------------------------------------------------------
ALTER TABLE public.rfqs
  ALTER COLUMN rfq_number SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Unique constraint per company
-- ---------------------------------------------------------------------------
ALTER TABLE public.rfqs
  DROP CONSTRAINT IF EXISTS rfqs_company_rfq_number_key;

ALTER TABLE public.rfqs
  ADD CONSTRAINT rfqs_company_rfq_number_key UNIQUE (company_id, rfq_number);

CREATE INDEX IF NOT EXISTS idx_rfqs_rfq_number ON public.rfqs(rfq_number);

-- ---------------------------------------------------------------------------
-- 5. Auto-generate rfq_number on INSERT (same pattern as po_number)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_rfq_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_year   TEXT;
  v_seq    INT;
BEGIN
  -- Skip if caller already supplied a value
  IF NEW.rfq_number IS NOT NULL AND NEW.rfq_number <> '' THEN
    RETURN NEW;
  END IF;

  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    NULLIF(REGEXP_REPLACE(rfq_number, '^RFQ-\d{4}-', ''), '')::INT
  ), 0) + 1
  INTO v_seq
  FROM public.rfqs
  WHERE company_id = NEW.company_id
    AND rfq_number LIKE 'RFQ-' || v_year || '-%';

  NEW.rfq_number := 'RFQ-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_rfq_number ON public.rfqs;
CREATE TRIGGER trg_generate_rfq_number
  BEFORE INSERT ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.generate_rfq_number();

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
