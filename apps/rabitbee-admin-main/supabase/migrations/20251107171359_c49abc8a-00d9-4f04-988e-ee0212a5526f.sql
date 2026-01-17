-- Add new columns to menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS rating_value NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS availability_window TEXT DEFAULT 'All Day';

COMMENT ON COLUMN menu_items.availability_window IS 'Suggested values: All Day, Breakfast, Lunch, Dinner, Late Night';