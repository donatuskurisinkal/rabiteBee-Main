-- Add delivery_charge column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;