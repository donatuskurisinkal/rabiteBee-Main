
-- Add isActive column to slot_overrides table
ALTER TABLE public.slot_overrides 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
