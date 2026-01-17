
-- Get all screens
CREATE OR REPLACE FUNCTION public.get_all_screens()
RETURNS TABLE(
  id uuid,
  name text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT s.id, s.name, s.is_active, s.created_at, s.updated_at
  FROM public.screens s
  ORDER BY s.name;
END;
$$;

-- Get screens with pagination
CREATE OR REPLACE FUNCTION public.get_screens_paginated(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_offset integer := (p_page - 1) * p_page_size;
  v_count bigint;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO v_count FROM public.screens;
  
  -- Return paginated results with total count
  RETURN QUERY 
  SELECT 
    s.id, 
    s.name, 
    s.is_active, 
    s.created_at, 
    s.updated_at,
    v_count as total_count
  FROM public.screens s
  ORDER BY s.name
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

-- Create screen
CREATE OR REPLACE FUNCTION public.create_screen(
  p_name text,
  p_is_active boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.screens (name, is_active)
  VALUES (p_name, p_is_active)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Update screen
CREATE OR REPLACE FUNCTION public.update_screen(
  p_id uuid,
  p_name text,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.screens
  SET 
    name = p_name,
    is_active = p_is_active,
    updated_at = now()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- Update screen status
CREATE OR REPLACE FUNCTION public.update_screen_status(
  p_id uuid,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.screens
  SET 
    is_active = p_is_active,
    updated_at = now()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- Delete screen
CREATE OR REPLACE FUNCTION public.delete_screen(
  p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.screens
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- Get banners with pagination and filtering by screen_id
CREATE OR REPLACE FUNCTION public.get_banners_paginated(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 10,
  p_screen_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  image_url text,
  screen_id uuid,
  screen_name text,
  display_order integer,
  tenant_id uuid,
  tenant_name text,
  is_active boolean,
  created_at timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_offset integer := (p_page - 1) * p_page_size;
  v_count bigint;
BEGIN
  -- Get total count with filter if provided
  IF p_screen_id IS NULL THEN
    SELECT COUNT(*) INTO v_count FROM public.banners;
  ELSE
    SELECT COUNT(*) INTO v_count FROM public.banners b WHERE b.screen_id = p_screen_id;
  END IF;
  
  -- Return paginated results with total count
  RETURN QUERY 
  SELECT 
    b.id, 
    b.name, 
    b.image_url,
    b.screen_id,
    s.name as screen_name,
    b.display_order,
    b.tenant_id,
    t.name as tenant_name,
    b.is_active,
    b.created_at,
    v_count as total_count
  FROM public.banners b
  LEFT JOIN public.screens s ON b.screen_id = s.id
  LEFT JOIN public.tenants t ON b.tenant_id = t.id
  WHERE (p_screen_id IS NULL OR b.screen_id = p_screen_id)
  ORDER BY b.display_order
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

-- Get promo codes with pagination and filtering by screen_id
CREATE OR REPLACE FUNCTION public.get_promo_codes_paginated(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 10,
  p_screen_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  max_discount numeric,
  min_order_amount numeric,
  start_date date,
  end_date date,
  category text,
  promo_target text,
  is_active boolean,
  used_count integer,
  usage_limit integer,
  screen_id uuid,
  screen_name text,
  tenant_id uuid,
  tenant_name text,
  created_at timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_offset integer := (p_page - 1) * p_page_size;
  v_count bigint;
BEGIN
  -- Get total count with filter if provided
  IF p_screen_id IS NULL THEN
    SELECT COUNT(*) INTO v_count FROM public.promo_codes;
  ELSE
    SELECT COUNT(*) INTO v_count FROM public.promo_codes pc WHERE pc.screen_id = p_screen_id;
  END IF;
  
  -- Return paginated results with total count
  RETURN QUERY 
  SELECT 
    pc.id, 
    pc.code,
    pc.discount_type,
    pc.discount_value,
    pc.max_discount,
    pc.min_order_amount,
    pc.start_date,
    pc.end_date,
    pc.category,
    pc.promo_target,
    pc.is_active,
    pc.used_count,
    pc.usage_limit,
    pc.screen_id,
    s.name as screen_name,
    pc.tenant_id,
    t.name as tenant_name,
    pc.created_at,
    v_count as total_count
  FROM public.promo_codes pc
  LEFT JOIN public.screens s ON pc.screen_id = s.id
  LEFT JOIN public.tenants t ON pc.tenant_id = t.id
  WHERE (p_screen_id IS NULL OR pc.screen_id = p_screen_id)
  ORDER BY pc.created_at DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;

