-- Create storage bucket for support ticket attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', true);

-- Create storage policies for support attachments
CREATE POLICY "Users can upload their own support attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'support-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own support attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'support-attachments');

CREATE POLICY "Admins can view all support attachments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'support-attachments' AND
  (user_has_permission('manage_all') OR user_has_permission('manage_support_tickets'))
);

CREATE POLICY "Users can update their own support attachments" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'support-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own support attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'support-attachments' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);