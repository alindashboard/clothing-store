-- Key/value store for admin-toggleable site behaviour, so flags can change
-- without a deploy. First consumer: hiding products that have no photo yet.
-- lib/brand-accent.ts already anticipates this table for the design tokens.

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read (public pages check the flag during SSR)
CREATE POLICY "Site settings public read"
  ON site_settings FOR SELECT USING (true);

-- Only authenticated (admin) can write
CREATE POLICY "Site settings admin write"
  ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- Default OFF: the catalog is still largely imageless, so enabling this on
-- import would empty the storefront. The owner turns it on from the admin.
INSERT INTO site_settings (key, value)
VALUES ('hide_products_without_images', 'false')
ON CONFLICT (key) DO NOTHING;
