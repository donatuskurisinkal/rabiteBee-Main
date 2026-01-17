-- Add RLS policy for restaurant staff to update their restaurant's table orders
CREATE POLICY "Restaurant staff can update their restaurant orders"
ON public.table_orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.restaurant_id = table_orders.restaurant_id
  )
);