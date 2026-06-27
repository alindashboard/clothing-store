-- =============================================
-- Products performance indexes
-- Safe to re-run (IF NOT EXISTS on all)
-- =============================================

-- Lookup by slug — product detail page (/product/[slug])
CREATE INDEX IF NOT EXISTS idx_products_slug
  ON public.products (slug);

-- Filter by is_active — used on every public query
CREATE INDEX IF NOT EXISTS idx_products_is_active
  ON public.products (is_active);

-- Sort by created_at DESC — default order on all catalog pages
CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON public.products (created_at DESC);

-- Combined partial index: active products sorted by date
-- Covers: getProducts(), getProductsPage() — the most common query pattern
CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON public.products (is_active, created_at DESC)
  WHERE is_active = true;

-- Filter by category — used on category pages and admin filter
CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products (category_id);

-- Featured products for homepage (partial index — small, fast)
CREATE INDEX IF NOT EXISTS idx_products_featured
  ON public.products (is_featured, created_at DESC)
  WHERE is_featured = true AND is_active = true;

-- Case-insensitive name search — used in admin new-arrivals search
CREATE INDEX IF NOT EXISTS idx_products_name_lower
  ON public.products (lower(name));

-- product_images FK join — used in every product query with images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON public.product_images (product_id);

-- Primary image lookup (partial index — tiny, covers common UI pattern)
CREATE INDEX IF NOT EXISTS idx_product_images_primary
  ON public.product_images (product_id, is_primary)
  WHERE is_primary = true;

-- product_variants FK join — used in every product query with variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON public.product_variants (product_id);
