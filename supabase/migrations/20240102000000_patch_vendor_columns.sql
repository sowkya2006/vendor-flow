-- =============================================================================
-- VendorFlow Patch Migration — Fix vendor column names & category enum
-- =============================================================================
-- Run this in the Supabase SQL Editor if you already ran the initial migration.
-- It renames columns and updates the vendor_category enum to match the
-- TypeScript types used by the front-end.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Rename vendor columns to match TypeScript Vendor type
-- ---------------------------------------------------------------------------

-- contract_start → contract_start_date
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'contract_start'
  ) THEN
    ALTER TABLE public.vendors RENAME COLUMN contract_start TO contract_start_date;
  END IF;
END $$;

-- contract_end → contract_end_date
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'contract_end'
  ) THEN
    ALTER TABLE public.vendors RENAME COLUMN contract_end TO contract_end_date;
  END IF;
END $$;

-- annual_value → contract_value
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vendors' AND column_name = 'annual_value'
  ) THEN
    ALTER TABLE public.vendors RENAME COLUMN annual_value TO contract_value;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Update vendor_category enum values to match TypeScript VendorCategory
-- ---------------------------------------------------------------------------
-- Strategy: create new enum → swap column type → drop old enum

DO $$ BEGIN
  -- Only run if the old enum values exist
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'vendor_category' AND e.enumlabel = 'technology'
  ) THEN

    -- Create the replacement enum
    CREATE TYPE vendor_category_new AS ENUM (
      'software', 'hardware', 'services', 'consulting',
      'logistics', 'marketing', 'finance', 'legal', 'other'
    );

    -- Migrate existing rows: map old values to closest new values
    ALTER TABLE public.vendors ALTER COLUMN category DROP DEFAULT;

    ALTER TABLE public.vendors
      ALTER COLUMN category TYPE vendor_category_new
      USING (
        CASE category::text
          WHEN 'technology'  THEN 'software'
          WHEN 'operations'  THEN 'services'
          WHEN 'hr'          THEN 'other'
          WHEN 'facilities'  THEN 'other'
          ELSE category::text
        END
      )::vendor_category_new;

    -- Swap type names
    DROP TYPE vendor_category;
    ALTER TYPE vendor_category_new RENAME TO vendor_category;

  END IF;
END $$;

-- =============================================================================
-- END OF PATCH
-- =============================================================================
