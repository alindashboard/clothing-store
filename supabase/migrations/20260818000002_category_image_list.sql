-- Landing cards become a curated slideshow rather than a single image: an
-- ordered list of URLs, mixing uploads with photos picked from the category's
-- own products. Array order is slideshow order.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

-- Carry over anything already set as the single editorial image.
UPDATE categories
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_urls = '{}';

ALTER TABLE categories DROP COLUMN IF EXISTS image_url;
