-- Create storage bucket for store logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true);

-- Policy to allow authenticated users to upload their store logos
CREATE POLICY "Authenticated users can upload store logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'store-logos' AND auth.role() = 'authenticated');

-- Policy to allow public read access
CREATE POLICY "Public can view store logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'store-logos');

-- Policy to allow users to update their own uploads
CREATE POLICY "Users can update their store logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'store-logos' AND auth.role() = 'authenticated');

-- Policy to allow users to delete their uploads
CREATE POLICY "Users can delete their store logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'store-logos' AND auth.role() = 'authenticated');