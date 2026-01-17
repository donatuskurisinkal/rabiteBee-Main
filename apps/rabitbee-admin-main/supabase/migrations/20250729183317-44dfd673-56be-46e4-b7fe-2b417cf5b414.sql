-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES public.tenants(id),
  user_role TEXT NOT NULL CHECK (user_role IN ('customer', 'delivery_agent', 'service_provider')),
  issue_category TEXT NOT NULL CHECK (issue_category IN ('order_not_received', 'wrong_delayed_delivery', 'payment_issue', 'service_problem', 'app_bug', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for support tickets
CREATE POLICY "Users can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets in their tenant" 
ON public.support_tickets 
FOR SELECT 
USING (
  user_has_permission('manage_all') OR 
  user_has_permission('manage_support_tickets') OR
  (tenant_id = get_current_tenant_id())
);

CREATE POLICY "Admins can update tickets in their tenant" 
ON public.support_tickets 
FOR UPDATE 
USING (
  user_has_permission('manage_all') OR 
  user_has_permission('manage_support_tickets') OR
  (tenant_id = get_current_tenant_id())
);

-- Create trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_user_role ON public.support_tickets(user_role);
CREATE INDEX idx_support_tickets_issue_category ON public.support_tickets(issue_category);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);