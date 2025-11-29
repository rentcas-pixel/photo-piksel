-- =====================================================
-- FIX STORAGE POLICIES FOR PHOTO UPLOADS
-- Run this in Supabase SQL Editor
-- IMPORTANT: Use Service Role Key or run as database owner
-- =====================================================

-- Make sure bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop ALL existing storage policies for photos bucket
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies
-- SIMPLE: Allow authenticated users to upload photos (no complex checks)
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'photos');

-- Allow anyone to view photos (public bucket)
CREATE POLICY "Anyone can view photos" ON storage.objects
  FOR SELECT 
  TO public
  USING (bucket_id = 'photos');

-- Allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete photos" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (bucket_id = 'photos');

