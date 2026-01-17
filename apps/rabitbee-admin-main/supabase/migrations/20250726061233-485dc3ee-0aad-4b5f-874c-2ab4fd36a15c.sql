-- Update RLS policies for delivery_reassignments to allow broader access for order tracking
DROP POLICY IF EXISTS "Administrators can view all delivery reassignments" ON delivery_reassignments;
DROP POLICY IF EXISTS "Administrators can insert delivery reassignments" ON delivery_reassignments;
DROP POLICY IF EXISTS "Administrators can update delivery reassignments" ON delivery_reassignments;
DROP POLICY IF EXISTS "Administrators can delete delivery reassignments" ON delivery_reassignments;

-- Create new policies that allow access for authenticated users to view reassignments
-- This is needed for the order tracking modal to show reassignment history
CREATE POLICY "Allow viewing delivery reassignments for authenticated users" 
ON delivery_reassignments FOR SELECT 
USING (auth.role() = 'authenticated');

-- Keep restricted access for modifications - only users with proper permissions
CREATE POLICY "Allow insert delivery reassignments for administrators" 
ON delivery_reassignments FOR INSERT 
WITH CHECK (user_has_permission('manage_all'::text) OR user_has_permission('manage_orders'::text));

CREATE POLICY "Allow update delivery reassignments for administrators" 
ON delivery_reassignments FOR UPDATE 
USING (user_has_permission('manage_all'::text) OR user_has_permission('manage_orders'::text));

CREATE POLICY "Allow delete delivery reassignments for administrators" 
ON delivery_reassignments FOR DELETE 
USING (user_has_permission('manage_all'::text) OR user_has_permission('manage_orders'::text));