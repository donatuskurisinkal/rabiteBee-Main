-- Create tableOrderCart table for items added but not yet ordered
CREATE TABLE IF NOT EXISTS public.table_order_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  table_number TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tableOrders table for confirmed orders
CREATE TABLE IF NOT EXISTS public.table_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  table_number TEXT NOT NULL,
  order_items JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'served', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.table_order_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for table_order_cart
CREATE POLICY "Users can view their own cart items"
  ON public.table_order_cart FOR SELECT
  USING (phone_number = (SELECT phone FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own cart items"
  ON public.table_order_cart FOR INSERT
  WITH CHECK (phone_number = (SELECT phone FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own cart items"
  ON public.table_order_cart FOR UPDATE
  USING (phone_number = (SELECT phone FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own cart items"
  ON public.table_order_cart FOR DELETE
  USING (phone_number = (SELECT phone FROM users WHERE id = auth.uid()));

-- RLS Policies for table_orders
CREATE POLICY "Users can view their own orders"
  ON public.table_orders FOR SELECT
  USING (phone_number = (SELECT phone FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own orders"
  ON public.table_orders FOR INSERT
  WITH CHECK (phone_number = (SELECT phone FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all orders"
  ON public.table_orders FOR SELECT
  USING (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

CREATE POLICY "Admins can update all orders"
  ON public.table_orders FOR UPDATE
  USING (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

-- Add indexes for better performance
CREATE INDEX idx_table_order_cart_phone_table ON public.table_order_cart(phone_number, table_number);
CREATE INDEX idx_table_order_cart_item ON public.table_order_cart(item_id);
CREATE INDEX idx_table_orders_phone_table ON public.table_orders(phone_number, table_number);
CREATE INDEX idx_table_orders_status ON public.table_orders(status);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_table_orders_updated_at
  BEFORE UPDATE ON public.table_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();