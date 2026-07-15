-- =============================================================================
-- VendorFlow — Rename quotations.validity_date → valid_until
-- Migration: 20240116000000_rename_validity_date.sql
--
-- The application code uses valid_until consistently everywhere.
-- The initial schema used validity_date. Rename to match.
-- =============================================================================

ALTER TABLE public.quotations
  RENAME COLUMN validity_date TO valid_until;

-- =============================================================================
-- END
-- =============================================================================
