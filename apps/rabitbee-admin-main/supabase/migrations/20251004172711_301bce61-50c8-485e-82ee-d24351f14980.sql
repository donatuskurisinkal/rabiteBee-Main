-- Update get_service_provider_by_user_id function to ensure it returns restaurant_id
CREATE OR REPLACE FUNCTION public.get_service_provider_by_user_id(p_user_id uuid)
 RETURNS TABLE(id uuid, name text, restaurant_id uuid, email text, phone_number text, is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

-- Add RLS policy to allow service providers to update their own restaurant_id
DROP POLICY IF EXISTS "Service providers can update their own profile" ON service_providers;

CREATE POLICY "Service providers can update their own profile"
  ON service_providers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policy to allow service providers to view their own data
DROP POLICY IF EXISTS "Service providers can view their own data" ON service_providers;

CREATE POLICY "Service providers can view their own data"
  ON service_providers
  FOR SELECT
  USING (auth.uid() = user_id OR user_has_permission('manage_all') OR user_has_permission('manage_service_providers'));