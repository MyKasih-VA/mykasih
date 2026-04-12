-- Ensure csat_rating column exists (safe to run if already present)
ALTER TABLE calls ADD COLUMN IF NOT EXISTS csat_rating integer CHECK (csat_rating BETWEEN 1 AND 5);
