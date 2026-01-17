-- Ensure delivery-agents bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-agents',
  'delivery-agents', 
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/json', 'text/plain'];

-- Create storage policies for delivery-agents bucket
CREATE POLICY "Delivery agent images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'delivery-agents');

CREATE POLICY "Authenticated users can upload delivery agent images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'delivery-agents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update delivery agent images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'delivery-agents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete delivery agent images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'delivery-agents' AND auth.role() = 'authenticated');