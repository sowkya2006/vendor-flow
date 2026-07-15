-- =============================================================================
-- VendorFlow — Fix quotation totals trigger (RLS bypass)
-- Migration: 20240122000000_fix_quotation_totals_trigger.sql
--
-- Problem:
--   The `sync_quotation_grand_total` trigger fires AFTER INSERT/UPDATE/DELETE
--   on quotation_items and updates subtotal/tax_amount/grand_total on the
--   parent quotation row.
--
--   When a vendor user inserts quotation_items, the trigger runs in the
--   security context of the vendor. The vendor has no row in public.users with
--   a matching company_id, so `current_company_id()` returns NULL for them.
--   The RLS UPDATE policy on quotations requires `company_id = current_company_id()`,
--   which fails silently — leaving subtotal, tax_amount, and grand_total at 0.
--
-- Fix:
--   1. Recreate the trigger function as SECURITY DEFINER so it bypasses RLS.
--   2. Backfill any existing quotations whose totals are 0 but have items.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_quotation_grand_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER                          -- bypass RLS so vendor inserts work
SET search_path = public
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

  -- Sum from items: subtotal excludes per-item discounts, tax is separate
  SELECT
    COALESCE(SUM(quantity * unit_price - discount_amount), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO v_subtotal, v_tax
  FROM public.quotation_items
  WHERE quotation_id = v_qid;

  -- Header-level discount from the quotation row
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
    grand_total     = GREATEST(0, v_subtotal - v_disc_amt + v_tax),
    updated_at      = NOW()
  WHERE id = v_qid;

  RETURN NULL;
END;
$$;

-- Also fix the per-item totals trigger (BEFORE trigger) — no RLS issue here
-- but add SECURITY DEFINER for consistency and correctness.
CREATE OR REPLACE FUNCTION public.calc_quotation_item_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount NUMERIC(15,2);
  v_base     NUMERIC(15,2);
BEGIN
  v_base              := NEW.quantity * NEW.unit_price;
  v_discount          := ROUND(v_base * COALESCE(NEW.discount_pct, 0) / 100, 2);
  NEW.discount_amount := v_discount;
  NEW.tax_amount      := ROUND((v_base - v_discount) * COALESCE(NEW.tax_pct, 0) / 100, 2);
  NEW.line_total      := v_base - v_discount + NEW.tax_amount;
  RETURN NEW;
END;
$$;

-- Re-attach triggers (idempotent)
DROP TRIGGER IF EXISTS trg_calc_quotation_item_totals ON public.quotation_items;
CREATE TRIGGER trg_calc_quotation_item_totals
  BEFORE INSERT OR UPDATE ON public.quotation_items
  FOR EACH ROW EXECUTE FUNCTION public.calc_quotation_item_totals();

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
-- Backfill: fix any existing quotations that have items but show 0 totals
-- This runs once and corrects historical data created before this migration.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  v_subtotal  NUMERIC(15,2);
  v_tax       NUMERIC(15,2);
  v_disc_type TEXT;
  v_disc_val  NUMERIC(15,2);
  v_disc_amt  NUMERIC(15,2);
BEGIN
  FOR r IN
    SELECT DISTINCT q.id, q.discount_type, q.discount_value
    FROM public.quotations q
    JOIN public.quotation_items qi ON qi.quotation_id = q.id
    WHERE q.grand_total = 0 OR q.subtotal = 0
  LOOP
    SELECT
      COALESCE(SUM(quantity * unit_price - discount_amount), 0),
      COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_tax
    FROM public.quotation_items
    WHERE quotation_id = r.id;

    v_disc_type := COALESCE(r.discount_type, 'percentage');
    v_disc_val  := COALESCE(r.discount_value, 0);

    IF v_disc_type = 'percentage' THEN
      v_disc_amt := ROUND(v_subtotal * v_disc_val / 100, 2);
    ELSE
      v_disc_amt := v_disc_val;
    END IF;

    UPDATE public.quotations
    SET
      subtotal        = v_subtotal,
      tax_amount      = v_tax,
      discount_amount = v_disc_amt,
      grand_total     = GREATEST(0, v_subtotal - v_disc_amt + v_tax),
      updated_at      = NOW()
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- Also backfill line_total on quotation_items that are 0 but have a price
UPDATE public.quotation_items
SET
  discount_amount = ROUND(quantity * unit_price * COALESCE(discount_pct, 0) / 100, 2),
  tax_amount      = ROUND((quantity * unit_price - ROUND(quantity * unit_price * COALESCE(discount_pct, 0) / 100, 2)) * COALESCE(tax_pct, 0) / 100, 2),
  line_total      = quantity * unit_price
                    - ROUND(quantity * unit_price * COALESCE(discount_pct, 0) / 100, 2)
                    + ROUND((quantity * unit_price - ROUND(quantity * unit_price * COALESCE(discount_pct, 0) / 100, 2)) * COALESCE(tax_pct, 0) / 100, 2)
WHERE line_total = 0 AND unit_price > 0;

-- Re-run the quotation totals sync for rows that were just fixed above
DO $$
DECLARE
  r RECORD;
  v_subtotal  NUMERIC(15,2);
  v_tax       NUMERIC(15,2);
  v_disc_type TEXT;
  v_disc_val  NUMERIC(15,2);
  v_disc_amt  NUMERIC(15,2);
BEGIN
  FOR r IN
    SELECT DISTINCT q.id, q.discount_type, q.discount_value
    FROM public.quotations q
    JOIN public.quotation_items qi ON qi.quotation_id = q.id
    WHERE q.grand_total = 0 OR q.subtotal = 0
  LOOP
    SELECT
      COALESCE(SUM(quantity * unit_price - discount_amount), 0),
      COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_tax
    FROM public.quotation_items
    WHERE quotation_id = r.id;

    v_disc_type := COALESCE(r.discount_type, 'percentage');
    v_disc_val  := COALESCE(r.discount_value, 0);

    IF v_disc_type = 'percentage' THEN
      v_disc_amt := ROUND(v_subtotal * v_disc_val / 100, 2);
    ELSE
      v_disc_amt := v_disc_val;
    END IF;

    UPDATE public.quotations
    SET
      subtotal        = v_subtotal,
      tax_amount      = v_tax,
      discount_amount = v_disc_amt,
      grand_total     = GREATEST(0, v_subtotal - v_disc_amt + v_tax),
      updated_at      = NOW()
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
