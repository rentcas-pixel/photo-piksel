-- =====================================================
-- CLEANUP MIGRATION
-- Pašalina nereikalingus stulpelius ir RLS policies
-- =====================================================

-- 1. Pašalinti nereikalingus stulpelius iš agencies lentelės
ALTER TABLE agencies DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE agencies DROP COLUMN IF EXISTS email CASCADE;

-- 2. Pašalinti nereikalingus stulpelius iš clients lentelės
ALTER TABLE clients DROP COLUMN IF EXISTS description CASCADE;

-- 3. Pašalinti nereikalingus stulpelius iš photos lentelės
ALTER TABLE photos DROP COLUMN IF EXISTS thumbnail_url CASCADE;
ALTER TABLE photos DROP COLUMN IF EXISTS file_size CASCADE;
ALTER TABLE photos DROP COLUMN IF EXISTS mime_type CASCADE;

-- 4. Pašalinti visus senus RLS policies
DROP POLICY IF EXISTS "Users can view their own agency" ON agencies;
DROP POLICY IF EXISTS "Users can update their own agency" ON agencies;
DROP POLICY IF EXISTS "Agencies can view their own clients" ON clients;
DROP POLICY IF EXISTS "Agencies can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Agencies can update their own clients" ON clients;
DROP POLICY IF EXISTS "Agencies can delete their own clients" ON clients;
DROP POLICY IF EXISTS "Agencies can view photos of their clients" ON photos;
DROP POLICY IF EXISTS "Agencies can insert photos for their clients" ON photos;
DROP POLICY IF EXISTS "Agencies can update photos of their clients" ON photos;
DROP POLICY IF EXISTS "Agencies can delete photos of their clients" ON photos;

-- 5. Sukurti naujus RLS policies (public read, admin write)

-- Agencies policies
DROP POLICY IF EXISTS "Admins can insert agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can view all agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can update all agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can delete all agencies" ON agencies;
DROP POLICY IF EXISTS "Public can view all agencies" ON agencies;

CREATE POLICY "Admins can insert agencies" ON agencies
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can view all agencies" ON agencies
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can update all agencies" ON agencies
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can delete all agencies" ON agencies
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Public can view all agencies" ON agencies
  FOR SELECT USING (true);

-- Clients policies
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete all clients" ON clients;
DROP POLICY IF EXISTS "Public can view all clients" ON clients;

CREATE POLICY "Admins can insert clients" ON clients
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can delete all clients" ON clients
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Public can view all clients" ON clients
  FOR SELECT USING (true);

-- Photos policies
DROP POLICY IF EXISTS "Admins can insert photos" ON photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON photos;
DROP POLICY IF EXISTS "Admins can update photos" ON photos;
DROP POLICY IF EXISTS "Admins can delete photos" ON photos;
DROP POLICY IF EXISTS "Public can view all photos" ON photos;

CREATE POLICY "Admins can insert photos" ON photos
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can view all photos" ON photos
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can update photos" ON photos
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can delete photos" ON photos
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Public can view all photos" ON photos
  FOR SELECT USING (true);

