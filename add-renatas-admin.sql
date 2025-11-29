-- Add renatas@piksel.lt as admin user
-- Run this in Supabase SQL Editor

-- Update RLS policies to include renatas@piksel.lt

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can insert agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can view all agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can update all agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can delete all agencies" ON agencies;

DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete all clients" ON clients;

DROP POLICY IF EXISTS "Admins can insert photos" ON photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON photos;
DROP POLICY IF EXISTS "Admins can update all photos" ON photos;
DROP POLICY IF EXISTS "Admins can delete all photos" ON photos;

-- Recreate policies with both admin emails
CREATE POLICY "Admins can insert agencies" ON agencies
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all agencies" ON agencies
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all agencies" ON agencies
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all agencies" ON agencies
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can insert clients" ON clients
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all clients" ON clients
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can insert photos" ON photos
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all photos" ON photos
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all photos" ON photos
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all photos" ON photos
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

