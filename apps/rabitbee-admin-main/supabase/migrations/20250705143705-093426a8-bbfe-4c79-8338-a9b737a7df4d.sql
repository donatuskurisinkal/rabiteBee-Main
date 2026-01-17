
-- Create enum for wash booking statuses
CREATE TYPE wash_booking_status AS ENUM ('upcoming', 'in_progress', 'completed', 'cancelled');

-- Add the new status column to wash_bookings table
ALTER TABLE public.wash_bookings 
ADD COLUMN status wash_booking_status NOT NULL DEFAULT 'upcoming';

-- Update existing records to map from status_id to the new enum
-- You may need to adjust these mappings based on your actual status labels
UPDATE public.wash_bookings 
SET status = CASE 
  WHEN status_id IN (SELECT id FROM wash_booking_statuses WHERE LOWER(label) LIKE '%upcoming%' OR LOWER(label) LIKE '%pending%') THEN 'upcoming'
  WHEN status_id IN (SELECT id FROM wash_booking_statuses WHERE LOWER(label) LIKE '%progress%' OR LOWER(label) LIKE '%processing%') THEN 'in_progress'
  WHEN status_id IN (SELECT id FROM wash_booking_statuses WHERE LOWER(label) LIKE '%completed%' OR LOWER(label) LIKE '%done%') THEN 'completed'
  WHEN status_id IN (SELECT id FROM wash_booking_statuses WHERE LOWER(label) LIKE '%cancelled%' OR LOWER(label) LIKE '%cancel%') THEN 'cancelled'
  ELSE 'upcoming'
END;

-- Drop the foreign key constraint and the status_id column
ALTER TABLE public.wash_bookings 
DROP CONSTRAINT IF EXISTS wash_bookings_status_id_fkey;

ALTER TABLE public.wash_bookings 
DROP COLUMN status_id;
