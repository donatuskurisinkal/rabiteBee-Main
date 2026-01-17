-- Create enum for delivery agent status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_agent_status') THEN
    CREATE TYPE public.delivery_agent_status AS ENUM (
      'pending',
      'assigned', 
      'accepted',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled'
    );
  END IF;
END$$;

-- Remove default first, then alter column type
ALTER TABLE public.orders ALTER COLUMN delivery_agent_status DROP DEFAULT;

-- Update orders table to use the enum
ALTER TABLE public.orders 
ALTER COLUMN delivery_agent_status TYPE public.delivery_agent_status 
USING delivery_agent_status::public.delivery_agent_status;

-- Set new default
ALTER TABLE public.orders ALTER COLUMN delivery_agent_status SET DEFAULT 'pending';