-- Create restaurant_earnings table for tracking restaurant payouts
CREATE TABLE public.restaurant_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  gross_amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT false,
  settlement_batch_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_restaurant_earnings_restaurant_id ON public.restaurant_earnings(restaurant_id);
CREATE INDEX idx_restaurant_earnings_order_id ON public.restaurant_earnings(order_id);
CREATE INDEX idx_restaurant_earnings_settled ON public.restaurant_earnings(settled);
CREATE INDEX idx_restaurant_earnings_settlement_batch ON public.restaurant_earnings(settlement_batch_id);
CREATE INDEX idx_restaurant_earnings_created_at ON public.restaurant_earnings(created_at);

-- Enable Row Level Security
ALTER TABLE public.restaurant_earnings ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurant earnings
CREATE POLICY "Users can view restaurant earnings for their tenant"
ON public.restaurant_earnings FOR SELECT
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE tenant_id = get_current_tenant_id()
  ) OR is_superadmin()
);

CREATE POLICY "Users can insert restaurant earnings for their tenant"
ON public.restaurant_earnings FOR INSERT
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE tenant_id = get_current_tenant_id()
  ) OR is_superadmin()
);

CREATE POLICY "Users can update restaurant earnings for their tenant"
ON public.restaurant_earnings FOR UPDATE
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE tenant_id = get_current_tenant_id()
  ) OR is_superadmin()
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_restaurant_earnings_updated_at
BEFORE UPDATE ON public.restaurant_earnings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create settlement_batches table for tracking bulk settlements
CREATE TABLE public.settlement_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT NOT NULL,
  total_restaurants INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  settlement_date DATE NOT NULL,
  created_by UUID REFERENCES public.users(id),
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for settlement_batches
ALTER TABLE public.settlement_batches ENABLE ROW LEVEL SECURITY;

-- Create policies for settlement_batches
CREATE POLICY "Users can view settlement batches for their tenant"
ON public.settlement_batches FOR SELECT
USING (tenant_id = get_current_tenant_id() OR is_superadmin());

CREATE POLICY "Users can insert settlement batches for their tenant"
ON public.settlement_batches FOR INSERT
WITH CHECK (tenant_id = get_current_tenant_id() OR is_superadmin());

CREATE POLICY "Users can update settlement batches for their tenant"
ON public.settlement_batches FOR UPDATE
USING (tenant_id = get_current_tenant_id() OR is_superadmin());

-- Create trigger for settlement_batches timestamp updates
CREATE TRIGGER update_settlement_batches_updated_at
BEFORE UPDATE ON public.settlement_batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();