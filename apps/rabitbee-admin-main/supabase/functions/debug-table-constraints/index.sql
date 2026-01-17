
-- Create function to get constraints info for a table
CREATE OR REPLACE FUNCTION public.get_table_constraints(table_name text)
RETURNS TABLE(
  constraint_name text,
  constraint_type text,
  table_name text,
  definition text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    con.conname as constraint_name,
    CASE con.contype
      WHEN 'c' THEN 'CHECK'
      WHEN 'f' THEN 'FOREIGN KEY'
      WHEN 'p' THEN 'PRIMARY KEY'
      WHEN 'u' THEN 'UNIQUE'
      ELSE con.contype::text
    END as constraint_type,
    t.relname as table_name,
    pg_get_constraintdef(con.oid) as definition
  FROM pg_constraint con
  JOIN pg_class t ON con.conrelid = t.oid
  JOIN pg_namespace nsp ON t.relnamespace = nsp.oid
  WHERE nsp.nspname = 'public' 
    AND t.relname = table_name;
END;
$$;

-- Function to get column information
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.attname as column_name,
    format_type(a.atttypid, a.atttypmod) as data_type,
    NOT a.attnotnull as is_nullable,
    pg_get_expr(d.adbin, d.adrelid) as column_default
  FROM pg_attribute a
  JOIN pg_class t ON a.attrelid = t.oid
  JOIN pg_namespace nsp ON t.relnamespace = nsp.oid
  LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
  WHERE nsp.nspname = 'public'
    AND t.relname = table_name
    AND a.attnum > 0
    AND NOT a.attisdropped
  ORDER BY a.attnum;
END;
$$;

-- Function to get check constraints specifically
CREATE OR REPLACE FUNCTION public.get_check_constraints(table_name_param text)
RETURNS TABLE(
  constraint_name text,
  definition text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as definition
  FROM pg_constraint con
  JOIN pg_class t ON con.conrelid = t.oid
  JOIN pg_namespace nsp ON t.relnamespace = nsp.oid
  WHERE nsp.nspname = 'public' 
    AND t.relname = table_name_param
    AND con.contype = 'c';  -- 'c' is for check constraint
END;
$$;

-- Function to get foreign keys
CREATE OR REPLACE FUNCTION public.get_foreign_keys(p_table_name text)
RETURNS TABLE(
  constraint_name text,
  column_name text,
  referenced_table text,
  referenced_column text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = p_table_name
    AND tc.table_schema = 'public';
END;
$$;

-- Function to check if a user can login
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
  email_exists boolean;
BEGIN
  -- Check if user exists in auth.users
  SELECT id, email INTO auth_user_id, auth_email
  FROM auth.users
  WHERE email = p_username || '@example.com';
  
  email_exists := FOUND;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.is_verified,
    u.isActive,
    u.role,
    auth_email,
    email_exists,
    (u.id IS NOT NULL) as exists_in_users
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE u.username = p_username
  LIMIT 1;
END;
$$;
