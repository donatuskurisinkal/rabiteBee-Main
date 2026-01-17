-- Create delivery_reassignments table
CREATE TABLE IF NOT EXISTS public.delivery_reassignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_agent_id UUID REFERENCES public.delivery_agents(id) ON DELETE SET NULL,
  to_agent_id UUID REFERENCES public.delivery_agents(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status_before delivery_agent_status,
  status_after delivery_agent_status,
  tenant_id UUID REFERENCES public.tenants(id),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_reassignments ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_reassignments_order_id ON public.delivery_reassignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_reassignments_from_agent_id ON public.delivery_reassignments(from_agent_id);
CREATE INDEX IF NOT EXISTS idx_delivery_reassignments_to_agent_id ON public.delivery_reassignments(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_delivery_reassignments_tenant_id ON public.delivery_reassignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_reassignments_timestamp ON public.delivery_reassignments(timestamp);

-- RLS Policies
CREATE POLICY "Administrators can view all delivery reassignments"
ON public.delivery_reassignments
FOR SELECT
USING (user_has_permission('manage_all'::text) OR user_has_permission('manage_orders'::text));

CREATE POLICY "Administrators can insert delivery reassignments"
ON public.delivery_reassignments
FOR INSERT
WITH CHECK (user_has_permission('manage_all'::text) OR user_has_permission('manage_orders'::text));

CREATE POLICY "Administrators can update delivery reassignments"
ON public.delivery_reassignments
FOR UPDATE
USING (user_has_permission('manage_all'::text) OR user_has_permission('manage_orders'::text));

CREATE POLICY "Administrators can delete delivery reassignments"
ON public.delivery_reassignments
FOR DELETE
USING (user_has_permission('manage_all'::text) OR user_has_permission('manage_orders'::text));

-- Add trigger for updated_at
CREATE TRIGGER update_delivery_reassignments_updated_at
  BEFORE UPDATE ON public.delivery_reassignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();