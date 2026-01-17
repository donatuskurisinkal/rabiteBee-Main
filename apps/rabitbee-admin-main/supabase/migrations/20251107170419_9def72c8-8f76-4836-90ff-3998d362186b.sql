-- Add new fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS availability_window TEXT DEFAULT 'All Day';

-- Add comment for availability_window enum values
COMMENT ON COLUMN restaurants.availability_window IS 'Availability window options: All Day, Morning, Afternoon, Evening, Night';