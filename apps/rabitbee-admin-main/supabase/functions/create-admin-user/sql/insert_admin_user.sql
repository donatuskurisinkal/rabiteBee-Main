
-- This is a helper SQL file that will be executed by the edge function if needed
CREATE OR REPLACE FUNCTION public.insert_admin_user(user_id UUID, role_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    username, 
    first_name, 
    last_name, 
    role, 
    role_id, 
    is_verified,
    isActive
  ) VALUES (
    user_id,
    'admin',
    'Admin',
    'User',
    'admin',
    role_id,
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role_id = EXCLUDED.role_id,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified;
END;
$$;
