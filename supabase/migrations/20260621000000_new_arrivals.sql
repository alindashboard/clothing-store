-- =============================================
-- NEW ARRIVALS — curated list table
-- =============================================
CREATE TABLE new_arrivals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position    INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

CREATE INDEX idx_new_arrivals_position ON new_arrivals(position);
CREATE INDEX idx_new_arrivals_created  ON new_arrivals(created_at DESC);

ALTER TABLE new_arrivals ENABLE ROW LEVEL SECURITY;

-- Public can read (carousel + public page)
CREATE POLICY "New arrivals visible to all"
  ON new_arrivals FOR SELECT USING (true);

-- Only authenticated (admin) can write
CREATE POLICY "New arrivals admin write"
  ON new_arrivals FOR ALL USING (auth.role() = 'authenticated');
