
-- Create slot_overrides table for car wash management
CREATE TABLE public.slot_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES public.wash_time_slots(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  max_bookings INTEGER NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slot_id, override_date, tenant_id)
);

-- Add RLS policies for slot_overrides
ALTER TABLE public.slot_overrides ENABLE ROW LEVEL SECURITY;

-- Policy for viewing slot overrides (admin/users with manage permissions)
CREATE POLICY "Users can view slot overrides for their tenant"
  ON public.slot_overrides
  FOR SELECT
  USING (
    user_has_permission('manage_all'::text) OR 
    user_has_permission('manage_wash_bookings'::text) OR
    tenant_id = get_current_tenant_id()
  );

-- Policy for creating slot overrides (admin/users with manage permissions)
CREATE POLICY "Users can create slot overrides for their tenant"
  ON public.slot_overrides
  FOR INSERT
  WITH CHECK (
    (user_has_permission('manage_all'::text) OR user_has_permission('manage_wash_bookings'::text)) AND
    (tenant_id = get_current_tenant_id() OR tenant_id IS NULL)
  );

-- Policy for updating slot overrides (admin/users with manage permissions)
CREATE POLICY "Users can update slot overrides for their tenant"
  ON public.slot_overrides
  FOR UPDATE
  USING (
    (user_has_permission('manage_all'::text) OR user_has_permission('manage_wash_bookings'::text)) AND
    tenant_id = get_current_tenant_id()
  );

-- Policy for deleting slot overrides (admin/users with manage permissions)
CREATE POLICY "Users can delete slot overrides for their tenant"
  ON public.slot_overrides
  FOR DELETE
  USING (
    (user_has_permission('manage_all'::text) OR user_has_permission('manage_wash_bookings'::text)) AND
    tenant_id = get_current_tenant_id()
  );

-- Add trigger for updated_at
CREATE TRIGGER update_slot_overrides_updated_at
  BEFORE UPDATE ON public.slot_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
