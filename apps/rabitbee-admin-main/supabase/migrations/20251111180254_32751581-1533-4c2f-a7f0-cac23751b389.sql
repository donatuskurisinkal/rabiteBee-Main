-- Change combo_description from text to text array
ALTER TABLE menu_items 
ALTER COLUMN combo_description TYPE text[] USING 
  CASE 
    WHEN combo_description IS NULL THEN NULL
    WHEN combo_description = '' THEN NULL
    ELSE ARRAY[combo_description]
  END;