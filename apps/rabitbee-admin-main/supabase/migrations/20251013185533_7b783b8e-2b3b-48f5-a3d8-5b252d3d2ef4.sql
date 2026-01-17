-- Enable Row Level Security on banners table
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Allow administrators to view all banners
CREATE POLICY "Administrators can view all banners"
ON public.banners
FOR SELECT
USING (
  user_has_permission('manage_all') OR 
  user_has_permission('manage_banners')
);

-- Allow administrators to insert banners
CREATE POLICY "Administrators can insert banners"
ON public.banners
FOR INSERT
WITH CHECK (
  user_has_permission('manage_all') OR 
  user_has_permission('manage_banners')
);

-- Allow administrators to update banners
CREATE POLICY "Administrators can update banners"
ON public.banners
FOR UPDATE
USING (
  user_has_permission('manage_all') OR 
  user_has_permission('manage_banners')
)
WITH CHECK (
  user_has_permission('manage_all') OR 
  user_has_permission('manage_banners')
);

-- Allow administrators to delete banners
CREATE POLICY "Administrators can delete banners"
ON public.banners
FOR DELETE
USING (
  user_has_permission('manage_all') OR 
  user_has_permission('manage_banners')
);