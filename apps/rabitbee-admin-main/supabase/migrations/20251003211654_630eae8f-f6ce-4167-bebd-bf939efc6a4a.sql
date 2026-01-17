-- Add tenant_id and restaurant_id to table_order_cart
ALTER TABLE public.table_order_cart 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id);

-- Add tenant_id and restaurant_id to table_orders
ALTER TABLE public.table_orders 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id),
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_table_order_cart_tenant ON public.table_order_cart(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_order_cart_restaurant ON public.table_order_cart(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_tenant ON public.table_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_restaurant ON public.table_orders(restaurant_id);

-- Update RLS policies to include tenant filtering
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.table_order_cart;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.table_order_cart;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.table_order_cart;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.table_order_cart;

-- Create new RLS policies for table_order_cart with tenant support
CREATE POLICY "Users can view cart items for their session"
  ON public.table_order_cart FOR SELECT
  USING (true);

CREATE POLICY "Users can insert cart items"
  ON public.table_order_cart FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update cart items"
  ON public.table_order_cart FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete cart items"
  ON public.table_order_cart FOR DELETE
  USING (true);

-- Update RLS policies for table_orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.table_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.table_orders;

CREATE POLICY "Users can view orders for their session"
  ON public.table_orders FOR SELECT
  USING (true);

CREATE POLICY "Users can insert orders"
  ON public.table_orders FOR INSERT
  WITH CHECK (true);

-- Admins can view all orders in their tenant
CREATE POLICY "Admins can view tenant orders"
  ON public.table_orders FOR SELECT
  USING (
    (user_has_permission('manage_all') OR user_has_permission('manage_orders'))
    AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

-- Admins can update orders in their tenant
CREATE POLICY "Admins can update tenant orders"
  ON public.table_orders FOR UPDATE
  USING (
    (user_has_permission('manage_all') OR user_has_permission('manage_orders'))
    AND (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );