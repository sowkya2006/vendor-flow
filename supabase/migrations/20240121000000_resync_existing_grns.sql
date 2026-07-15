-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20240121000000_resync_existing_grns.sql
-- 
-- Run in Supabase SQL Editor.
-- 
-- Step A: Diagnostic — shows current state
-- Step B: Reset over-counted inventory (idempotent re-sync)
-- Step C: Create products + inventory from PO items for completed GRNs
-- ─────────────────────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════
-- STEP A — DIAGNOSTIC (runs first, shows counts)
-- ══════════════════════════════════════════════════════════════
SELECT 'GRNs total'              AS label, COUNT(*)::TEXT AS value FROM public.grn
UNION ALL SELECT 'GRNs completed',         COUNT(*)::TEXT FROM public.grn WHERE status = 'completed'
UNION ALL SELECT 'GRNs completed with PO', COUNT(*)::TEXT FROM public.grn WHERE status = 'completed' AND purchase_order_id IS NOT NULL
UNION ALL SELECT 'PO items',               COUNT(*)::TEXT FROM public.purchase_order_items
UNION ALL SELECT 'GRN items',              COUNT(*)::TEXT FROM public.grn_items
UNION ALL SELECT 'Products',               COUNT(*)::TEXT FROM public.products
UNION ALL SELECT 'Inventory records',      COUNT(*)::TEXT FROM public.inventory
UNION ALL SELECT 'Inv transactions (grn)', COUNT(*)::TEXT FROM public.inventory_transactions WHERE transaction_type = 'grn'
UNION ALL SELECT 'Warehouses',             COUNT(*)::TEXT FROM public.warehouses;
