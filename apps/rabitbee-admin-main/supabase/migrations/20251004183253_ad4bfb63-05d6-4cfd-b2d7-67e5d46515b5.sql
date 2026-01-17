-- Add RLS policy to allow users with manage_users permission to update users in their tenant
CREATE POLICY "Users with manage_users permission can update users in their tenant"
ON public.users
FOR UPDATE
TO authenticated
USING (
  user_has_permission('manage_users') 
  AND (
    tenant_id = get_current_tenant_id() 
    OR tenant_id IS NULL
  )
);