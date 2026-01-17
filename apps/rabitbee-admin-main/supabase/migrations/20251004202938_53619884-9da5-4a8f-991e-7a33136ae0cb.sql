-- Add tracking timestamps for table order status changes
DO $$
BEGIN
  -- Add confirmed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'table_orders' 
    AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE public.table_orders ADD COLUMN confirmed_at timestamp with time zone;
  END IF;

  -- Add cancelled_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'table_orders' 
    AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE public.table_orders ADD COLUMN cancelled_at timestamp with time zone;
  END IF;

  -- Add preparing_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'table_orders' 
    AND column_name = 'preparing_at'
  ) THEN
    ALTER TABLE public.table_orders ADD COLUMN preparing_at timestamp with time zone;
  END IF;

  -- Add ready_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'table_orders' 
    AND column_name = 'ready_at'
  ) THEN
    ALTER TABLE public.table_orders ADD COLUMN ready_at timestamp with time zone;
  END IF;

  -- Add completed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'table_orders' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.table_orders ADD COLUMN completed_at timestamp with time zone;
  END IF;
END$$;

-- Create index for faster queries on status changes
CREATE INDEX IF NOT EXISTS idx_table_orders_confirmed_at ON public.table_orders(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_table_orders_cancelled_at ON public.table_orders(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_table_orders_completed_at ON public.table_orders(completed_at);

COMMENT ON COLUMN public.table_orders.confirmed_at IS 'Timestamp when order was accepted by restaurant';
COMMENT ON COLUMN public.table_orders.cancelled_at IS 'Timestamp when order was rejected by restaurant';
COMMENT ON COLUMN public.table_orders.preparing_at IS 'Timestamp when order preparation started';
COMMENT ON COLUMN public.table_orders.ready_at IS 'Timestamp when order was marked ready';
COMMENT ON COLUMN public.table_orders.completed_at IS 'Timestamp when order was completed';