-- Editorial image for a category, used by the landing grid. When set it wins
-- over the automatic slider built from the category's product photos, so the
-- three landing cards can be chosen deliberately instead of following whatever
-- happens to be the newest photographed product.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS image_url TEXT;
