
-- Run the SQL functions from functions.sql to ensure they are created

-- Make sure we have the day_of_week enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_of_week') THEN
    CREATE TYPE public.day_of_week AS ENUM (
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday'
    );
  END IF;
END$$;

-- Ensure peak_hours has the correct structure
DO $$
BEGIN
  -- Check if location_id exists and drop it if it does
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'peak_hours'
      AND column_name = 'location_id'
  ) THEN
    ALTER TABLE public.peak_hours DROP COLUMN location_id;
  END IF;

  -- Add tenant_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'peak_hours'
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.peak_hours ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
  END IF;

  -- Update day_of_week column to use enum type
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'peak_hours'
      AND column_name = 'day_of_week'
      AND data_type <> 'USER-DEFINED'
  ) THEN
    -- Drop and recreate the column to use the enum
    ALTER TABLE public.peak_hours DROP COLUMN IF EXISTS day_of_week;
    ALTER TABLE public.peak_hours ADD COLUMN day_of_week public.day_of_week;
  END IF;
END$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS update_peak_hours_updated_at ON public.peak_hours;
CREATE TRIGGER update_peak_hours_updated_at
  BEFORE UPDATE ON public.peak_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure promo_codes has screen_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'promo_codes'
      AND column_name = 'screen_id'
  ) THEN
    ALTER TABLE public.promo_codes ADD COLUMN screen_id UUID REFERENCES public.screens(id);
    CREATE INDEX IF NOT EXISTS idx_promo_codes_screen_id ON public.promo_codes(screen_id);
  END IF;
END$$;

