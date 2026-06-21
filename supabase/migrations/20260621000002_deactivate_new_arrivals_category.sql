-- Deactivate the "new-arrivals" DB category so it no longer appears in the
-- public nav. The curated /new-arrivals feature (new_arrivals table) replaces it.
-- Products keep their category_id unchanged; only nav visibility changes.
UPDATE categories SET is_active = false WHERE slug = 'new-arrivals';
