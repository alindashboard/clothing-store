-- Move the landing-page category selection out of lib/config.ts into the DB,
-- so it can be managed from the admin panel instead of requiring a deploy.
-- Landing order follows categories.sort_order (the up/down arrows in admin).

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS show_on_landing BOOLEAN NOT NULL DEFAULT false;

-- Preserve the current landing selection (brand.landingCategorySlugs).
UPDATE categories
SET show_on_landing = true
WHERE slug IN ('sneakers', 'sets', 'shirts');
