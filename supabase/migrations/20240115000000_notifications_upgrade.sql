-- =============================================================================
-- VendorFlow — Notifications Upgrade
-- Migration: 20240115000000_notifications_upgrade.sql
--
-- Changes:
-- 1. Make approval_notifications.request_id nullable so we can insert
--    non-approval notifications (vendor events, system alerts, etc.)
--    without needing a sentinel nil UUID.
-- 2. Add link, entity_type, entity_id columns for click-through navigation.
-- 3. Enable Supabase Realtime on approval_notifications so the browser
--    receives live updates without polling.
-- 4. Add a per-recipient RLS SELECT policy so self-registered vendors
--    (who have no company_id) can also read their own notifications.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Make request_id nullable (was NOT NULL before)
-- ---------------------------------------------------------------------------
ALTER TABLE public.approval_notifications
  ALTER COLUMN request_id DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Add navigation / context columns (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.approval_notifications
  ADD COLUMN IF NOT EXISTS link         TEXT,         -- e.g. /approvals/uuid
  ADD COLUMN IF NOT EXISTS entity_type  TEXT,         -- 'rfq','vendor','po','invoice','system'…
  ADD COLUMN IF NOT EXISTS entity_id    UUID;         -- the related record id

-- ---------------------------------------------------------------------------
-- 3. Enable Supabase Realtime for live bell updates
--    (This adds the table to the supabase_realtime publication)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- publication may already exist but may not include this table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_notifications;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- silently ignore if already added or publication doesn't exist
  END;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Add a per-recipient SELECT policy so any authenticated user can read
--    their own notifications regardless of company_id (covers vendor users)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS approval_notifs_own_select ON public.approval_notifications;
CREATE POLICY approval_notifs_own_select ON public.approval_notifications
  FOR SELECT USING (recipient_id = auth.uid());

-- Also allow recipient to update (mark read) their own notifications
DROP POLICY IF EXISTS approval_notifs_own_update ON public.approval_notifications;
CREATE POLICY approval_notifs_own_update ON public.approval_notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Allow recipient to delete (dismiss) their own notifications
DROP POLICY IF EXISTS approval_notifs_own_delete ON public.approval_notifications;
CREATE POLICY approval_notifs_own_delete ON public.approval_notifications
  FOR DELETE USING (recipient_id = auth.uid());

-- =============================================================================
-- END
-- =============================================================================
