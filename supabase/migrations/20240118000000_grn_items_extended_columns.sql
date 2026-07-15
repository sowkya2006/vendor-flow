-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20240118000000_grn_items_extended_columns.sql
--
-- Adds the extended columns to grn_items that the GRN form now populates:
--   item_name        — display name copied from PO line item description
--   description      — full description (same as item_name typically)
--   sku              — stock-keeping unit, optional
--   unit             — unit of measure (pcs, kg, m, etc.)
--   tax_percentage   — tax rate for the item
--   accepted_quantity — subset of received_quantity that passed QC
--   rejected_quantity — subset that failed QC / was damaged
--   damage_notes     — description of any damage found
--   batch_number     — batch / lot number for traceability
--   serial_numbers   — comma-separated serial numbers
--   warehouse_location — bin / rack location in warehouse
--
-- Also adds grn_id column to invoices so the invoice ↔ GRN link is stored.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── grn_items: make product_id nullable (it was NOT NULL before) ──────────────
-- GRNs are now created from PO line items which may not map to a product.
ALTER TABLE grn_items
  ALTER COLUMN product_id DROP NOT NULL;

-- ── grn_items: add extended columns ──────────────────────────────────────────
ALTER TABLE grn_items
  ADD COLUMN IF NOT EXISTS item_name         TEXT,
  ADD COLUMN IF NOT EXISTS description       TEXT,
  ADD COLUMN IF NOT EXISTS sku               VARCHAR(100),
  ADD COLUMN IF NOT EXISTS unit              VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tax_percentage    NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_quantity NUMERIC(12,3),
  ADD COLUMN IF NOT EXISTS rejected_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS damage_notes      TEXT,
  ADD COLUMN IF NOT EXISTS batch_number      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS serial_numbers    TEXT,
  ADD COLUMN IF NOT EXISTS warehouse_location VARCHAR(200);

-- Back-fill item_name from notes for existing rows that have notes but no item_name
UPDATE grn_items
SET item_name = notes
WHERE item_name IS NULL AND notes IS NOT NULL;

-- Back-fill accepted_quantity = received_quantity for rows without it yet
UPDATE grn_items
SET accepted_quantity = received_quantity
WHERE accepted_quantity IS NULL;

-- ── invoices: add grn_id foreign-key ─────────────────────────────────────────
-- This links an invoice directly to the GRN that triggered it,
-- enabling precise 3-way matching (PO ↔ GRN ↔ Invoice).
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS grn_id UUID REFERENCES grn(id) ON DELETE SET NULL;

-- ── invoice_items: add columns for 3-way match quantity tracking ─────────────
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS ordered_quantity  NUMERIC(12,3),
  ADD COLUMN IF NOT EXISTS received_quantity NUMERIC(12,3),
  ADD COLUMN IF NOT EXISTS unit              VARCHAR(50);

-- Back-fill: set ordered/received = invoiced quantity for existing rows
UPDATE invoice_items
SET
  ordered_quantity  = COALESCE(ordered_quantity, quantity),
  received_quantity = COALESCE(received_quantity, quantity)
WHERE ordered_quantity IS NULL OR received_quantity IS NULL;

-- ── RLS: grn_items — company users should be able to read/write their own ─────
-- These policies assume the grn_items table has NO policies yet (common for
-- newly-added columns). If policies already exist, this will be a no-op.
DO $$
BEGIN
  -- Select policy for company users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'grn_items' AND policyname = 'Company users can view their grn_items'
  ) THEN
    CREATE POLICY "Company users can view their grn_items"
      ON grn_items FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM grn g
          JOIN users u ON u.company_id = g.company_id
          WHERE g.id = grn_items.grn_id
            AND u.id = auth.uid()
        )
      );
  END IF;

  -- Insert policy for company users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'grn_items' AND policyname = 'Company users can insert grn_items'
  ) THEN
    CREATE POLICY "Company users can insert grn_items"
      ON grn_items FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM grn g
          JOIN users u ON u.company_id = g.company_id
          WHERE g.id = grn_items.grn_id
            AND u.id = auth.uid()
        )
      );
  END IF;

  -- Update policy for company users (warehouse managers)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'grn_items' AND policyname = 'Company users can update grn_items'
  ) THEN
    CREATE POLICY "Company users can update grn_items"
      ON grn_items FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM grn g
          JOIN users u ON u.company_id = g.company_id
          WHERE g.id = grn_items.grn_id
            AND u.id = auth.uid()
        )
      );
  END IF;
END;
$$;

-- ── Indexes for the new FK ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_grn_id ON invoices(grn_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_grn_id ON grn_items(grn_id);
