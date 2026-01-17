-- Add change_amount column to orders table to store the change given back amount
ALTER TABLE public.orders 
ADD COLUMN change_amount NUMERIC(10,2) DEFAULT 0;