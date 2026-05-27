-- =============================================
-- CURĂȚĂ SCHEMA VECHE DIN TEMPLATE
-- =============================================
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS item_images CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;

-- =============================================
-- CATEGORII
-- =============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- =============================================
-- PRODUSE
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_new BOOLEAN NOT NULL DEFAULT false,
  sku_prefix TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);

-- =============================================
-- PRODUCT VARIANTS
-- =============================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT DEFAULT '#000000',
  sku TEXT UNIQUE,
  price_override DECIMAL(10,2),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_stock ON product_variants(stock_quantity);

-- =============================================
-- PRODUCT IMAGES
-- =============================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  color_name TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_images_product ON product_images(product_id);

-- =============================================
-- COMENZI
-- =============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'IT',
  billing_same_as_shipping BOOLEAN NOT NULL DEFAULT true,
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_method TEXT DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'failed')),
  payment_intent_id TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_size TEXT NOT NULL,
  variant_color TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- =============================================
-- CONTACT REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- FUNCȚIE: generare order number
-- =============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 4));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- =============================================
-- FUNCȚIE: update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products visible to all" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Products admin access" ON products FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variants visible to all" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "Variants admin access" ON product_variants FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Images visible to all" ON product_images FOR SELECT USING (true);
CREATE POLICY "Images admin access" ON product_images FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories visible to all" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Categories admin access" ON categories FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders admin access" ON orders FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items admin access" ON order_items FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact" ON contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Contact admin access" ON contact_requests FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- SEED DATA — Categorii
-- =============================================
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Man', 'man', 'Men''s collection', 1),
  ('Woman', 'woman', 'Women''s collection', 2),
  ('Kids', 'kids', 'Kids'' collection', 3),
  ('Accessories', 'accessories', 'Bags, hats, belts and more', 4),
  ('Sneakers', 'sneakers', 'Footwear collection', 5),
  ('New Arrivals', 'new-arrivals', 'Latest drops', 6),
  ('Sale', 'sale', 'Discounted items', 7);

-- =============================================
-- SEED DATA — Produse demo
-- =============================================
INSERT INTO products (name, slug, description, short_description, base_price, category_id, is_active, is_featured, is_new, sku_prefix) VALUES
(
  'Logo Print T-Shirt',
  'logo-print-tshirt',
  'Classic oversized t-shirt with signature logo print on the front. 100% cotton, regular fit.',
  'Signature logo t-shirt',
  75.00,
  (SELECT id FROM categories WHERE slug = 'man'),
  true, true, true, 'TSH'
),
(
  'Denim Shorts',
  'denim-shorts',
  'Relaxed fit denim shorts with embroidered details. 100% cotton denim.',
  'Relaxed fit denim shorts',
  180.00,
  (SELECT id FROM categories WHERE slug = 'man'),
  true, true, false, 'DNM'
),
(
  'Printed Jeans',
  'printed-jeans',
  'Straight leg jeans with all-over paint splatter print. Limited edition.',
  'Paint splatter print jeans',
  320.00,
  (SELECT id FROM categories WHERE slug = 'man'),
  true, false, true, 'JNS'
),
(
  'Club Dreamers Sweater',
  'club-dreamers-sweater',
  'Oversized knit sweater with "Club of Dreamers" embroidery. Cotton blend.',
  'Club of Dreamers knit sweater',
  178.00,
  (SELECT id FROM categories WHERE slug = 'woman'),
  true, true, false, 'SWT'
);

INSERT INTO product_variants (product_id, size, color_name, color_hex, sku, stock_quantity, sort_order) VALUES
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), 'S', 'Black', '#000000', 'TSH-BLK-S', 10, 1),
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), 'M', 'Black', '#000000', 'TSH-BLK-M', 15, 2),
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), 'L', 'Black', '#000000', 'TSH-BLK-L', 8, 3),
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), 'XL', 'Black', '#000000', 'TSH-BLK-XL', 5, 4),
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), 'S', 'White', '#FFFFFF', 'TSH-WHT-S', 12, 5),
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), 'M', 'White', '#FFFFFF', 'TSH-WHT-M', 0, 6),
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), 'L', 'White', '#FFFFFF', 'TSH-WHT-L', 7, 7),
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), 'XL', 'White', '#FFFFFF', 'TSH-WHT-XL', 3, 8);

INSERT INTO product_variants (product_id, size, color_name, color_hex, sku, stock_quantity, sort_order) VALUES
  ((SELECT id FROM products WHERE slug = 'denim-shorts'), '26', 'Denim Ghiaccio', '#B0C4DE', 'DNM-DGH-26', 4, 1),
  ((SELECT id FROM products WHERE slug = 'denim-shorts'), '28', 'Denim Ghiaccio', '#B0C4DE', 'DNM-DGH-28', 6, 2),
  ((SELECT id FROM products WHERE slug = 'denim-shorts'), '30', 'Denim Ghiaccio', '#B0C4DE', 'DNM-DGH-30', 8, 3),
  ((SELECT id FROM products WHERE slug = 'denim-shorts'), '32', 'Denim Ghiaccio', '#B0C4DE', 'DNM-DGH-32', 5, 4),
  ((SELECT id FROM products WHERE slug = 'denim-shorts'), '36', 'Denim Ghiaccio', '#B0C4DE', 'DNM-DGH-36', 2, 5);

INSERT INTO product_variants (product_id, size, color_name, color_hex, sku, stock_quantity, sort_order) VALUES
  ((SELECT id FROM products WHERE slug = 'printed-jeans'), '30', 'Multicolor', '#4682B4', 'JNS-MLT-30', 3, 1),
  ((SELECT id FROM products WHERE slug = 'printed-jeans'), '32', 'Multicolor', '#4682B4', 'JNS-MLT-32', 4, 2);

INSERT INTO product_variants (product_id, size, color_name, color_hex, sku, stock_quantity, sort_order) VALUES
  ((SELECT id FROM products WHERE slug = 'club-dreamers-sweater'), 'S', 'Pink', '#FFB6C1', 'SWT-PNK-S', 6, 1),
  ((SELECT id FROM products WHERE slug = 'club-dreamers-sweater'), 'M', 'Pink', '#FFB6C1', 'SWT-PNK-M', 8, 2),
  ((SELECT id FROM products WHERE slug = 'club-dreamers-sweater'), 'L', 'Pink', '#FFB6C1', 'SWT-PNK-L', 4, 3);

INSERT INTO product_images (product_id, url, alt_text, color_name, is_primary, sort_order) VALUES
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), '/images/placeholder-product.svg', 'Logo Print T-Shirt Black', 'Black', true, 1),
  ((SELECT id FROM products WHERE slug = 'logo-print-tshirt'), '/images/placeholder-product.svg', 'Logo Print T-Shirt White', 'White', false, 2),
  ((SELECT id FROM products WHERE slug = 'denim-shorts'), '/images/placeholder-product.svg', 'Denim Shorts', 'Denim Ghiaccio', true, 1),
  ((SELECT id FROM products WHERE slug = 'printed-jeans'), '/images/placeholder-product.svg', 'Printed Jeans', 'Multicolor', true, 1),
  ((SELECT id FROM products WHERE slug = 'club-dreamers-sweater'), '/images/placeholder-product.svg', 'Club Dreamers Sweater', 'Pink', true, 1);
