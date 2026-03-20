-- =====================================================
-- FIX: Update ALL RLS policies to include renatas@piksel.lt
-- Šis failas atnaujina visas RLS politikas, kad abu admin vartotojai
-- (admin@piksel.lt ir renatas@piksel.lt) galėtų valdyti visas lenteles
-- =====================================================

BEGIN;

-- =====================================================
-- 1. AGENCIES (Agentūros)
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can view all agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can update all agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can delete all agencies" ON agencies;

CREATE POLICY "Admins can insert agencies" ON agencies
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all agencies" ON agencies
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all agencies" ON agencies
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all agencies" ON agencies
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

-- =====================================================
-- 2. CLIENTS (Klientai)
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete all clients" ON clients;

CREATE POLICY "Admins can insert clients" ON clients
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all clients" ON clients
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

-- =====================================================
-- 3. CAMPAIGNS (Kampanijos) - PAGRINDINĖ PROBLEMA
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins can view all campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins can update all campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins can delete all campaigns" ON campaigns;

CREATE POLICY "Admins can insert campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all campaigns" ON campaigns
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all campaigns" ON campaigns
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all campaigns" ON campaigns
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

-- =====================================================
-- 4. PHOTOS (Nuotraukos)
-- =====================================================
DROP POLICY IF EXISTS "Admins can insert photos" ON photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON photos;
DROP POLICY IF EXISTS "Admins can update all photos" ON photos;
DROP POLICY IF EXISTS "Admins can delete all photos" ON photos;

CREATE POLICY "Admins can insert photos" ON photos
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all photos" ON photos
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all photos" ON photos
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all photos" ON photos
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Visos RLS politikos sėkmingai atnaujintos!';
  RAISE NOTICE '✅ Abi admin paskyros (admin@piksel.lt ir renatas@piksel.lt) dabar gali valdyti visas lenteles';
  RAISE NOTICE '✅ Agentūros, Klientai, Kampanijos, Nuotraukos - visos politikos atnaujintos';
END $$;

COMMIT;

