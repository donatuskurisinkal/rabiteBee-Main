-- Add service_provider_id and restaurant_id columns to users table for dashboard routing
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS service_provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_service_provider_id ON public.users(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_users_restaurant_id ON public.users(restaurant_id);

-- Add comment explaining the columns
COMMENT ON COLUMN public.users.service_provider_id IS 'Links user to service_providers table for service provider role routing';
COMMENT ON COLUMN public.users.restaurant_id IS 'Links user to restaurants table for restaurant-specific dashboard routing';

-- Update existing service providers to link their user records
-- This will populate the service_provider_id for existing users who are service providers
UPDATE public.users u
SET service_provider_id = sp.id,
    restaurant_id = sp.restaurant_id
FROM public.service_providers sp
WHERE u.id = sp.user_id
  AND u.service_provider_id IS NULL;