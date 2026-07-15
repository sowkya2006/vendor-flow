-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20240120000000_inventory_valuation_and_grn_products.sql
--
-- 1. Update existing inventory rows to compute correct valuation
--    (quantity_on_hand × product.unit_cost) where valuation = 0 and qty > 0
--
-- 2. Add RLS policies for products table so vendor portal can read products
--    linked to their vendor.
-- ─────────────────────────────────────────────────────────────────────────────

-- Recompute valuation for all inventory rows where it is 0 but qty > 0
UPDATE public.inventory AS inv
SET valuation = inv.quantity_on_hand * COALESCE(p.unit_cost, 0)
FROM public.products AS p
WHERE inv.product_id = p.id
  AND inv.valuation = 0
  AND inv.quantity_on_hand > 0;

-- Create a trigger to auto-update valuation whenever quantity_on_hand changes
CREATE OR REPLACE FUNCTION public.sync_inventory_valuation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_unit_cost NUMERIC(12,2);
BEGIN
  SELECT unit_cost INTO v_unit_cost
  FROM public.products
  WHERE id = NEW.product_id;

  NEW.valuation := NEW.quantity_on_hand * COALESCE(v_unit_cost, 0);
  NEW.last_updated := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_inventory_valuation ON public.inventory;
CREATE TRIGGER trg_sync_inventory_valuation
  BEFORE INSERT OR UPDATE OF quantity_on_hand ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.sync_inventory_valuation();

-- RLS: allow company users to read/write products in their company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Company users can read products'
  ) THEN
    CREATE POLICY "Company users can read products"
      ON public.products FOR SELECT
      USING (
        company_id IN (
          SELECT company_id FROM public.users WHERE id = auth.uid()
        )
      );
  END IF;
END;
$$;
