-- Create service provider role
INSERT INTO public.roles (name) 
VALUES ('Service Provider')
ON CONFLICT DO NOTHING;

-- Get the service provider role ID and assign permissions
DO $$
DECLARE
  service_provider_role_id UUID;
  manage_restaurants_permission_id UUID;
  view_dashboard_permission_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO service_provider_role_id FROM public.roles WHERE name = 'Service Provider';
  
  -- Get permission IDs
  SELECT id INTO manage_restaurants_permission_id FROM public.permissions WHERE key = 'manage_restaurants';
  SELECT id INTO view_dashboard_permission_id FROM public.permissions WHERE key = 'view_dashboard';
  
  -- Assign permissions to service provider role
  IF service_provider_role_id IS NOT NULL AND manage_restaurants_permission_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (service_provider_role_id, manage_restaurants_permission_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF service_provider_role_id IS NOT NULL AND view_dashboard_permission_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (service_provider_role_id, view_dashboard_permission_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;