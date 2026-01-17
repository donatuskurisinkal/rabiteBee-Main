-- Add iscombo and combo_description columns to menu_items table
ALTER TABLE menu_items 
ADD COLUMN iscombo boolean DEFAULT false,
ADD COLUMN combo_description text;