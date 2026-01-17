-- Create the aronk user by calling the reset-user-password function via HTTP
-- This will create both auth.users and public.users entries

DO $$
DECLARE
  service_role_key text;
  response_status int;
BEGIN
  -- Get service role key from vault
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets 
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  
  -- First create the public.users entry with a temporary ID matching what will be created
  -- We'll let the edge function handle auth.users creation and sync
  
  -- Call the reset-user-password edge function to create/reset the user
  PERFORM net.http_post(
    url := 'https://elcbugfsnqitkkgvhapa.supabase.co/functions/v1/reset-user-password',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'username', 'aronk',
      'first_name', 'Aron',
      'last_name', 'K',
      'role_id', '33da7469-7dab-4c44-9e28-0e5ca80759a5',
      'tenant_id', 'cda9bd96-2f5f-4298-ae61-e599c071db2c'
    )
  );
  
  RAISE NOTICE 'User creation initiated via edge function. Username: aronk, Password: aronk123';
END $$;