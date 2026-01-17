-- Create RLS policies for orders table to allow administrators to view orders
CREATE POLICY "Administrators can view all orders" ON orders
FOR SELECT
USING (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

CREATE POLICY "Administrators can insert orders" ON orders
FOR INSERT
WITH CHECK (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

CREATE POLICY "Administrators can update orders" ON orders
FOR UPDATE
USING (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

CREATE POLICY "Administrators can delete orders" ON orders
FOR DELETE
USING (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

-- Also allow users to view their own orders
CREATE POLICY "Users can view their own orders" ON orders
FOR SELECT
USING (auth.uid() = user_id);