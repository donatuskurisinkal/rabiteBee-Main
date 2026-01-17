
-- Drop the wash_booking_statuses table
DROP TABLE IF EXISTS public.wash_booking_statuses CASCADE;

-- Remove the status_id column from wash_bookings table (if it still exists)
ALTER TABLE public.wash_bookings 
DROP COLUMN IF EXISTS status_id;
