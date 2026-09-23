-- English product copy + "brand label" photo flag.
--
-- description / short_description stay the Italian (default locale) copy; the
-- *_en columns are optional and the storefront falls back to Italian when they
-- are empty, so this migration changes nothing visible until they are filled
-- (by hand in the admin, or by the AI generator in /admin/products).
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description_en       TEXT,
  ADD COLUMN IF NOT EXISTS short_description_en TEXT;

-- Marks a photo that shows the brand label / composition tag. The PDP uses it
-- for an authenticity note, and the description generator sends these photos
-- first, since they are the only reliable source for material composition.
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS is_label BOOLEAN NOT NULL DEFAULT false;
