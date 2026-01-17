-- Create wallets table
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('top_up', 'order_payment', 'refund', 'cashback')),
  amount DECIMAL(10,2) NOT NULL,
  source_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet" 
ON public.wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.wallets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallets" 
ON public.wallets 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their own wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (true);

-- Admins can view all wallet data
CREATE POLICY "Admins can view all wallets" 
ON public.wallets 
FOR ALL 
USING (user_has_permission('manage_all') OR user_has_permission('manage_finance'));

CREATE POLICY "Admins can view all wallet transactions" 
ON public.wallet_transactions 
FOR ALL 
USING (user_has_permission('manage_all') OR user_has_permission('manage_finance'));

-- Function to update wallet last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update wallet timestamp
CREATE TRIGGER update_wallet_timestamp
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_wallet_timestamp();

-- Function to create wallet on user signup
CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet when user signs up
CREATE TRIGGER on_auth_user_created_wallet
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_wallet();

-- Function to safely update wallet balance
CREATE OR REPLACE FUNCTION public.update_wallet_balance(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_transaction_type TEXT,
  p_source_order_id UUID DEFAULT NULL,
  p_remarks TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.wallets
  WHERE user_id = p_user_id;
  
  -- Check if wallet exists
  IF current_balance IS NULL THEN
    -- Create wallet if it doesn't exist
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, 0.00);
    current_balance := 0.00;
  END IF;
  
  -- For debit transactions, ensure sufficient balance
  IF p_amount < 0 AND (current_balance + p_amount) < 0 THEN
    RETURN FALSE; -- Insufficient balance
  END IF;
  
  -- Update wallet balance
  UPDATE public.wallets
  SET balance = balance + p_amount,
      last_updated = now()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.wallet_transactions (
    user_id, 
    type, 
    amount, 
    source_order_id, 
    remarks,
    tenant_id
  )
  VALUES (
    p_user_id, 
    p_transaction_type, 
    p_amount, 
    p_source_order_id, 
    p_remarks,
    p_tenant_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;