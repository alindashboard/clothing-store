-- Migrate Romanian category slugs to English
UPDATE categories SET slug = 'sets'      WHERE slug = 'seturi';
UPDATE categories SET slug = 'shirts'    WHERE slug = 'tricouri';
UPDATE categories SET slug = 'footwear'  WHERE slug = 'papuci';
