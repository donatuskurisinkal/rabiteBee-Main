-- Change rating_count from text to integer in menu_items table
-- First drop the default
ALTER TABLE menu_items 
ALTER COLUMN rating_count DROP DEFAULT;

-- Change the type
ALTER TABLE menu_items 
ALTER COLUMN rating_count TYPE integer USING COALESCE(rating_count::integer, 0);

-- Set new default value
ALTER TABLE menu_items 
ALTER COLUMN rating_count SET DEFAULT 0;