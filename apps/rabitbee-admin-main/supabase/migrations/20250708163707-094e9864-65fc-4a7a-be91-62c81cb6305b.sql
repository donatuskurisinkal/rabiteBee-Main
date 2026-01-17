
-- Add new columns to delivery_agents table
ALTER TABLE public.delivery_agents 
ADD COLUMN pending_orders integer DEFAULT 0,
ADD COLUMN scheduled_orders integer DEFAULT 0,
ADD COLUMN today_earnings numeric DEFAULT 0;
