-- Link service providers to user accounts and restaurants
ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_restaurant_id ON service_providers(restaurant_id);

-- Enable RLS on service_providers
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service providers can view their own data" ON service_providers;
DROP POLICY IF EXISTS "Service providers can update their own data" ON service_providers;
DROP POLICY IF EXISTS "Admins can manage service providers" ON service_providers;

-- Service providers can view their own data
CREATE POLICY "Service providers can view their own data"
ON service_providers
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_has_permission('manage_all'));

-- Service providers can update their own data
CREATE POLICY "Service providers can update their own data"
ON service_providers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR user_has_permission('manage_all'));

-- Admins can manage all service providers
CREATE POLICY "Admins can manage service providers"
ON service_providers
FOR ALL
TO authenticated
USING (user_has_permission('manage_all'));

-- Create a function to get service provider by user ID
CREATE OR REPLACE FUNCTION get_service_provider_by_user_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  restaurant_id UUID,
  email TEXT,
  phone_number TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    sp.restaurant_id,
    sp.email,
    sp.phone_number,
    sp.is_active
  FROM service_providers sp
  WHERE sp.user_id = p_user_id;
END;
$$;