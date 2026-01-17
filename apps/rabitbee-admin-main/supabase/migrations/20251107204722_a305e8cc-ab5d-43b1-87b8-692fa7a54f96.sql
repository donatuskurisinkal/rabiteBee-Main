-- Add unavailable_reason column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN unavailable_reason text;