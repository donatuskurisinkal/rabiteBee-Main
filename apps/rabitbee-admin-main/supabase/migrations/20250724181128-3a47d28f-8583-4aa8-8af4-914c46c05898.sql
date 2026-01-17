-- Create agent_order_rejections table
CREATE TABLE public.agent_order_rejections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  reason TEXT,
  rejection_type TEXT DEFAULT 'manual',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  device_info TEXT,
  tenant_id UUID,
  
  -- Foreign key constraints
  CONSTRAINT fk_agent_order_rejections_order_id 
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_agent_order_rejections_agent_id 
    FOREIGN KEY (agent_id) REFERENCES public.delivery_agents(id) ON DELETE CASCADE,
  CONSTRAINT fk_agent_order_rejections_tenant_id 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.agent_order_rejections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Administrators can view all agent order rejections" 
ON public.agent_order_rejections 
FOR SELECT 
USING (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

CREATE POLICY "Administrators can insert agent order rejections" 
ON public.agent_order_rejections 
FOR INSERT 
WITH CHECK (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

CREATE POLICY "Administrators can update agent order rejections" 
ON public.agent_order_rejections 
FOR UPDATE 
USING (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

CREATE POLICY "Administrators can delete agent order rejections" 
ON public.agent_order_rejections 
FOR DELETE 
USING (user_has_permission('manage_all') OR user_has_permission('manage_orders'));

-- Create indexes for better performance
CREATE INDEX idx_agent_order_rejections_order_id ON public.agent_order_rejections(order_id);
CREATE INDEX idx_agent_order_rejections_agent_id ON public.agent_order_rejections(agent_id);
CREATE INDEX idx_agent_order_rejections_tenant_id ON public.agent_order_rejections(tenant_id);
CREATE INDEX idx_agent_order_rejections_created_at ON public.agent_order_rejections(created_at);
CREATE INDEX idx_agent_order_rejections_attempt_number ON public.agent_order_rejections(attempt_number);

-- Create trigger for updated_at
CREATE TRIGGER update_agent_order_rejections_updated_at
  BEFORE UPDATE ON public.agent_order_rejections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();