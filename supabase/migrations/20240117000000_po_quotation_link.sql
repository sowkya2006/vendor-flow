-- =============================================================================
-- VendorFlow — Link Purchase Orders to Quotations
-- Migration: 20240117000000_po_quotation_link.sql
--
-- Adds quotation_id to purchase_orders so every PO is traceable to the
-- approved quotation that triggered it. Also adds a unique constraint to
-- prevent two POs from the same quotation.
-- =============================================================================

-- Add quotation_id FK (nullable for legacy POs)
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_po_quotation_id ON public.purchase_orders(quotation_id);

-- Unique constraint: one PO per quotation
CREATE UNIQUE INDEX IF NOT EXISTS idx_po_unique_quotation
  ON public.purchase_orders(quotation_id)
  WHERE quotation_id IS NOT NULL;

-- Add vendor_acceptance column to track vendor response
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS vendor_acceptance TEXT
    CHECK (vendor_acceptance IN ('pending', 'accepted', 'rejected', 'clarification_requested'))
    DEFAULT 'pending';

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS vendor_accepted_at TIMESTAMPTZ;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS vendor_rejection_reason TEXT;

-- Add approved_by to track who approved
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
