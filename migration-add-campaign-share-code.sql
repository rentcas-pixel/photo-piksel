-- Trumpa vieša nuoroda: /p/{share_code} → peradresuoja į pilną kelią
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS share_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_share_code_unique
  ON campaigns(share_code)
  WHERE share_code IS NOT NULL;
