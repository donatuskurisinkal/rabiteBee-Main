-- Add delivered_at column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;