
-- Create function to check if a user can login
CREATE OR REPLACE FUNCTION public.check_user_login_ability(p_username text)
RETURNS TABLE(
  user_id uuid,
  username text,
  is_verified boolean,
  is_active boolean,
  role_name text,
  auth_email text,
  exists_in_auth boolean,
  exists_in_users boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid;
  auth_email_value text;
BEGIN
  -- Check if user exists in auth.users
  SELECT id, email INTO auth_user_id, auth_email_value
  FROM auth.users
  WHERE email = p_username || '@example.com';
  
  -- Return query
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.is_verified,
    u.isActive,
    u.role,
    auth_email_value,
    (auth_user_id IS NOT NULL) as exists_in_auth,
    (u.id IS NOT NULL) as exists_in_users
  FROM public.users u
  WHERE u.username = p_username
  LIMIT 1;
END;
$$;
