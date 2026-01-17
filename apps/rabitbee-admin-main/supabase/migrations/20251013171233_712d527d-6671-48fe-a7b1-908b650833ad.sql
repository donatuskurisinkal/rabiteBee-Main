-- Add storage policies for banners bucket to allow uploads

-- Allow authenticated users to upload to banners bucket
CREATE POLICY "Allow authenticated users to upload banners"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');

-- Allow authenticated users to update their banners
CREATE POLICY "Allow authenticated users to update banners"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'banners');

-- Allow authenticated users to delete banners
CREATE POLICY "Allow authenticated users to delete banners"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'banners');

-- Allow public read access to banners (since bucket is public)
CREATE POLICY "Public read access to banners"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banners');