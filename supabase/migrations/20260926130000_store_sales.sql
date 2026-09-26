-- In-store sales log. The shop's till rings up "one piece + price" and knows
-- nothing about products, so the site is the only stock ledger: the owner
-- records each in-store sale from /admin/store-sales, which decrements the
-- variant's stock and keeps this row as the record (with undo).

CREATE TABLE IF NOT EXISTS store_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SET NULL: a stock re-import wipes products/variants; the sale record stays.
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  -- Snapshots, like order_items, so the log stays readable after a wipe.
  product_name TEXT NOT NULL,
  variant_size TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  -- Site price at the time; informational only (the till price is what was charged).
  unit_price NUMERIC(10,2),
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  undone_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_store_sales_sold_at ON store_sales (sold_at DESC);

-- Service role only (admin Server Actions): no policies = no anon/authenticated access.
ALTER TABLE store_sales ENABLE ROW LEVEL SECURITY;

-- Atomic decrement + log. The conditional UPDATE makes two taps on the last
-- piece safe: the second finds stock_quantity < qty and raises.
CREATE OR REPLACE FUNCTION record_store_sale(p_variant_id UUID, p_quantity INTEGER DEFAULT 1)
RETURNS store_sales
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v RECORD;
  sale store_sales;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'invalid_quantity';
  END IF;

  UPDATE product_variants
     SET stock_quantity = stock_quantity - p_quantity
   WHERE id = p_variant_id AND stock_quantity >= p_quantity
  RETURNING id, product_id, size, sku, price_override INTO v;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM product_variants WHERE id = p_variant_id) THEN
      RAISE EXCEPTION 'insufficient_stock';
    END IF;
    RAISE EXCEPTION 'variant_not_found';
  END IF;

  INSERT INTO store_sales (variant_id, product_id, product_name, variant_size, sku, quantity, unit_price)
  SELECT v.id, v.product_id, p.name, v.size, v.sku, p_quantity, COALESCE(v.price_override, p.base_price)
    FROM products p WHERE p.id = v.product_id
  RETURNING * INTO sale;

  RETURN sale;
END;
$$;

-- Undo restores the stock once; a second undo of the same row is a no-op error.
CREATE OR REPLACE FUNCTION undo_store_sale(p_sale_id UUID)
RETURNS store_sales
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  sale store_sales;
BEGIN
  UPDATE store_sales SET undone_at = now()
   WHERE id = p_sale_id AND undone_at IS NULL
  RETURNING * INTO sale;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'sale_not_found_or_undone';
  END IF;

  -- The variant may have been wiped by a re-import; the log row is still marked undone.
  UPDATE product_variants SET stock_quantity = stock_quantity + sale.quantity
   WHERE id = sale.variant_id;

  RETURN sale;
END;
$$;

-- Functions in `public` are callable over PostgREST by anon by default — these
-- change stock, so only the service role may run them.
REVOKE EXECUTE ON FUNCTION record_store_sale(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION undo_store_sale(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_store_sale(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION undo_store_sale(UUID) TO service_role;
