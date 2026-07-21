-- =====================================================
-- Security Advisor: RLS įjungimas + politikos sutvarkymas
-- Paleisk Supabase → SQL Editor → šis projektas, kurį naudoja Vercel
-- (Photo-proof / NEXT_PUBLIC_SUPABASE_URL turi sutapti)
-- =====================================================

BEGIN;

-- Admin el. paštai (sutampa su src/lib/admin.ts)
-- admin@piksel.lt, renatas@piksel.lt, romanas@piksel.lt

CREATE OR REPLACE FUNCTION public.is_piksel_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((select auth.jwt() ->> 'email'), '') IN (
    'admin@piksel.lt',
    'renatas@piksel.lt',
    'romanas@piksel.lt',
    'paulina@piksel.lt'
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 1. ĮJUNGTI RLS (kritinės Security Advisor klaidos)
-- =====================================================
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. AGENCIES — viena SELECT politika (be „multiple permissive“)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own agency" ON public.agencies;
DROP POLICY IF EXISTS "Users can update their own agency" ON public.agencies;
DROP POLICY IF EXISTS "Admins can insert agencies" ON public.agencies;
DROP POLICY IF EXISTS "Admins can view all agencies" ON public.agencies;
DROP POLICY IF EXISTS "Admins can update all agencies" ON public.agencies;
DROP POLICY IF EXISTS "Admins can delete all agencies" ON public.agencies;
DROP POLICY IF EXISTS "Public can view all agencies" ON public.agencies;
DROP POLICY IF EXISTS "agencies_public_select" ON public.agencies;
DROP POLICY IF EXISTS "agencies_admin_insert" ON public.agencies;
DROP POLICY IF EXISTS "agencies_admin_update" ON public.agencies;
DROP POLICY IF EXISTS "agencies_admin_delete" ON public.agencies;

CREATE POLICY "agencies_public_select" ON public.agencies
  FOR SELECT USING (true);

CREATE POLICY "agencies_admin_insert" ON public.agencies
  FOR INSERT WITH CHECK ((select public.is_piksel_admin()));

CREATE POLICY "agencies_admin_update" ON public.agencies
  FOR UPDATE USING ((select public.is_piksel_admin()));

CREATE POLICY "agencies_admin_delete" ON public.agencies
  FOR DELETE USING ((select public.is_piksel_admin()));

-- =====================================================
-- 3. CLIENTS
-- =====================================================
DROP POLICY IF EXISTS "Agencies can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Agencies can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Agencies can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Agencies can delete their own clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete all clients" ON public.clients;
DROP POLICY IF EXISTS "Public can view all clients" ON public.clients;
DROP POLICY IF EXISTS "clients_public_select" ON public.clients;
DROP POLICY IF EXISTS "clients_admin_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_admin_update" ON public.clients;
DROP POLICY IF EXISTS "clients_admin_delete" ON public.clients;

CREATE POLICY "clients_public_select" ON public.clients
  FOR SELECT USING (true);

CREATE POLICY "clients_admin_insert" ON public.clients
  FOR INSERT WITH CHECK ((select public.is_piksel_admin()));

CREATE POLICY "clients_admin_update" ON public.clients
  FOR UPDATE USING ((select public.is_piksel_admin()));

CREATE POLICY "clients_admin_delete" ON public.clients
  FOR DELETE USING ((select public.is_piksel_admin()));

-- =====================================================
-- 4. CAMPAIGNS
-- =====================================================
DROP POLICY IF EXISTS "Agencies can view campaigns of their clients" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can update all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can delete all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Public can view all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_public_select" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_insert" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_update" ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_delete" ON public.campaigns;

CREATE POLICY "campaigns_public_select" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "campaigns_admin_insert" ON public.campaigns
  FOR INSERT WITH CHECK ((select public.is_piksel_admin()));

CREATE POLICY "campaigns_admin_update" ON public.campaigns
  FOR UPDATE USING ((select public.is_piksel_admin()));

CREATE POLICY "campaigns_admin_delete" ON public.campaigns
  FOR DELETE USING ((select public.is_piksel_admin()));

-- =====================================================
-- 5. PHOTOS
-- =====================================================
DROP POLICY IF EXISTS "Agencies can view photos of their campaigns" ON public.photos;
DROP POLICY IF EXISTS "Agencies can view photos of their clients" ON public.photos;
DROP POLICY IF EXISTS "Agencies can insert photos for their clients" ON public.photos;
DROP POLICY IF EXISTS "Agencies can update photos of their clients" ON public.photos;
DROP POLICY IF EXISTS "Agencies can delete photos of their clients" ON public.photos;
DROP POLICY IF EXISTS "Admins can insert photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can update photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can update all photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can delete photos" ON public.photos;
DROP POLICY IF EXISTS "Admins can delete all photos" ON public.photos;
DROP POLICY IF EXISTS "Public can view all photos" ON public.photos;
DROP POLICY IF EXISTS "photos_public_select" ON public.photos;
DROP POLICY IF EXISTS "photos_admin_insert" ON public.photos;
DROP POLICY IF EXISTS "photos_admin_update" ON public.photos;
DROP POLICY IF EXISTS "photos_admin_delete" ON public.photos;

CREATE POLICY "photos_public_select" ON public.photos
  FOR SELECT USING (true);

CREATE POLICY "photos_admin_insert" ON public.photos
  FOR INSERT WITH CHECK ((select public.is_piksel_admin()));

CREATE POLICY "photos_admin_update" ON public.photos
  FOR UPDATE USING ((select public.is_piksel_admin()));

CREATE POLICY "photos_admin_delete" ON public.photos
  FOR DELETE USING ((select public.is_piksel_admin()));

-- =====================================================
-- 6. STORAGE (nuotraukų bucket)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "storage_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_photos_delete" ON storage.objects;

CREATE POLICY "storage_photos_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'photos');

CREATE POLICY "storage_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "storage_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND (select public.is_piksel_admin()));

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'RLS įjungtas. Paleisk Security Advisor → Refresh.';
  RAISE NOTICE 'Leaked password / Postgres upgrade — tik per Supabase Dashboard (Settings).';
END $$;
