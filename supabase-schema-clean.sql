-- =====================================================
-- PIKSEL PHOTO MANAGEMENT SYSTEM - CLEAN SCHEMA
-- Admin įkelia visas nuotraukas, agentūros gauna viešas nuorodas
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

-- Create agencies table (no auth, only public URLs via slug)
CREATE TABLE IF NOT EXISTS agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unique_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_agencies_unique_slug ON agencies(unique_slug);
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_photos_client_id ON photos(client_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;

-- Create triggers
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (Admin only)
-- =====================================================

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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
DROP POLICY IF EXISTS "Admins can insert agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can view all agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can update all agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can delete all agencies" ON agencies;
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete all clients" ON clients;
DROP POLICY IF EXISTS "Admins can insert photos" ON photos;
DROP POLICY IF EXISTS "Admins can update photos" ON photos;
DROP POLICY IF EXISTS "Admins can delete photos" ON photos;
DROP POLICY IF EXISTS "Public can view all agencies" ON agencies;
DROP POLICY IF EXISTS "Public can view all clients" ON clients;
DROP POLICY IF EXISTS "Public can view all photos" ON photos;

-- Admin-only policies for agencies
CREATE POLICY "Admins can insert agencies" ON agencies
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can view all agencies" ON agencies
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can update all agencies" ON agencies
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can delete all agencies" ON agencies
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

-- Public can view agencies (for slug-based access)
CREATE POLICY "Public can view all agencies" ON agencies
  FOR SELECT USING (true);

-- Admin-only policies for clients
CREATE POLICY "Admins can insert clients" ON clients
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can delete all clients" ON clients
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

-- Public can view clients (for public agency pages)
CREATE POLICY "Public can view all clients" ON clients
  FOR SELECT USING (true);

-- Admin-only policies for photos
CREATE POLICY "Admins can insert photos" ON photos
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can view all photos" ON photos
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can update photos" ON photos
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can delete photos" ON photos
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

-- Public can view photos (for public client pages)
CREATE POLICY "Public can view all photos" ON photos
  FOR SELECT USING (true);

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Create storage bucket for photos (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Update bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'photos';

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;

-- Storage policies
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can delete photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');

