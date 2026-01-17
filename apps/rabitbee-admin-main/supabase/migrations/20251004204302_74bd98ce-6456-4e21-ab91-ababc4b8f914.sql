-- Drop the existing check constraint
ALTER TABLE public.table_orders DROP CONSTRAINT IF EXISTS table_orders_status_check;

-- Add updated check constraint with accepted and rejected statuses
ALTER TABLE public.table_orders ADD CONSTRAINT table_orders_status_check 
CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'completed', 'rejected', 'cancelled'));