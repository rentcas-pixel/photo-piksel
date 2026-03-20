-- Vienkartinis paleidimas Supabase SQL Editor
-- Pasiūlymai iš viešų agentūros puslapių (įrašo tik API su service role)

CREATE TABLE IF NOT EXISTS feature_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  agency_slug TEXT NOT NULL,
  context TEXT NOT NULL CHECK (context IN ('agency_home', 'client', 'campaign')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  campaign_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_suggestions_agency_slug ON feature_suggestions(agency_slug);
CREATE INDEX IF NOT EXISTS idx_feature_suggestions_created_at ON feature_suggestions(created_at DESC);

ALTER TABLE feature_suggestions ENABLE ROW LEVEL SECURITY;

-- Be viešų policy: skaityti / rašyti gali tik service role (API route)

COMMENT ON TABLE feature_suggestions IS 'Klientų funkcionalumo pasiūlymai iš Photo Proof viešų puslapių';
