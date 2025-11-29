-- =====================================================
-- MULTI-TENANT PHOTO PROOF SYSTEM
-- Sistema: Agentūros → Klientai → Nuotraukos
-- Admin įkelia visas nuotraukas, agentūros tik peržiūri
-- =====================================================

-- Create agencies table (linked to auth.users)
CREATE TABLE IF NOT EXISTS agencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaigns table (projects/campaigns under clients)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table (linked to campaigns)
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;

-- Create triggers
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
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

-- =====================================================
-- RLS POLICIES - Each agency sees only their own data
-- =====================================================

-- Agencies policies
CREATE POLICY "Users can view their own agency" ON agencies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own agency" ON agencies
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for agencies
CREATE POLICY "Admins can insert agencies" ON agencies
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all agencies" ON agencies
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all agencies" ON agencies
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all agencies" ON agencies
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

-- Clients policies - Agency sees only their clients
CREATE POLICY "Agencies can view their own clients" ON clients
  FOR SELECT USING (
    agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Agencies can insert their own clients" ON clients
  FOR INSERT WITH CHECK (
    agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Agencies can update their own clients" ON clients
  FOR UPDATE USING (
    agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  );

-- Admin policies for clients
CREATE POLICY "Admins can insert clients" ON clients
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all clients" ON clients
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Agencies can delete their own clients" ON clients
  FOR DELETE USING (
    agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  );

-- Campaigns policies - Agency sees only campaigns of their clients
CREATE POLICY "Agencies can view campaigns of their clients" ON campaigns
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN agencies a ON c.agency_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Admin policies for campaigns
CREATE POLICY "Admins can insert campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can view all campaigns" ON campaigns
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can update all campaigns" ON campaigns
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

CREATE POLICY "Admins can delete all campaigns" ON campaigns
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt', 'renatas@piksel.lt'));

-- Photos policies - Agency sees only photos of their campaigns (READ-ONLY for agencies)
CREATE POLICY "Agencies can view photos of their campaigns" ON photos
  FOR SELECT USING (
    campaign_id IN (
      SELECT cam.id FROM campaigns cam
      JOIN clients c ON cam.client_id = c.id
      JOIN agencies a ON c.agency_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Admin can insert/update/delete photos (checked via application logic)
CREATE POLICY "Admins can insert photos" ON photos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update photos" ON photos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete photos" ON photos
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Create storage bucket for photos (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their photos" ON storage.objects;

-- Storage policies
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can delete photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
