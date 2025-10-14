-- =====================================================
-- MIGRATION: Add Campaigns (3rd level hierarchy)
-- Agentūra → Klientas → Kampanija → Nuotraukos
-- =====================================================

-- Step 1: Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create trigger for campaigns updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 3: Enable RLS on campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for campaigns
CREATE POLICY "Agencies can view campaigns of their clients" ON campaigns
  FOR SELECT USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN agencies a ON c.agency_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can view all campaigns" ON campaigns
  FOR SELECT USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can update all campaigns" ON campaigns
  FOR UPDATE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

CREATE POLICY "Admins can delete all campaigns" ON campaigns
  FOR DELETE USING (auth.jwt() ->> 'email' IN ('admin@piksel.lt'));

-- Step 5: Create default campaign for each existing client
INSERT INTO campaigns (client_id, name, description)
SELECT 
  id,
  'Pagrindinė kampanija',
  'Automatiškai sukurta kampanija esamoms nuotraukoms'
FROM clients
WHERE NOT EXISTS (
  SELECT 1 FROM campaigns WHERE campaigns.client_id = clients.id
);

-- Step 6: Add campaign_id column to photos (temporarily nullable)
ALTER TABLE photos ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;

-- Step 7: Migrate existing photos to default campaigns
UPDATE photos
SET campaign_id = (
  SELECT c.id 
  FROM campaigns c
  WHERE c.client_id = photos.client_id
  LIMIT 1
)
WHERE campaign_id IS NULL AND client_id IS NOT NULL;

-- Step 8: Make campaign_id required (after migration)
-- Note: We'll keep client_id for now to avoid breaking changes, can remove later
-- ALTER TABLE photos ALTER COLUMN campaign_id SET NOT NULL;
-- ALTER TABLE photos DROP COLUMN client_id;

-- Step 9: Update RLS policies for photos
DROP POLICY IF EXISTS "Agencies can view photos of their clients" ON photos;

CREATE POLICY "Agencies can view photos of their campaigns" ON photos
  FOR SELECT USING (
    campaign_id IN (
      SELECT cam.id FROM campaigns cam
      JOIN clients c ON cam.client_id = c.id
      JOIN agencies a ON c.agency_id = a.id
      WHERE a.user_id = auth.uid()
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '📁 Structure: Agentūra → Klientas → Kampanija → Nuotraukos';
END $$;

