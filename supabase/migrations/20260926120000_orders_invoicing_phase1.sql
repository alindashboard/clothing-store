-- Invoicing integration, phase 1: the per-line fiscal data an accounting system
-- (the owner's gestionale) imports, a real "paid" timestamp, and a collision-free
-- order number. All additive; safe on a live table.

-- VAT rate (percent) snapshotted per line at order time, like unit_price.
-- Every catalog item is 22% today; a snapshot keeps old orders correct if that changes.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) NOT NULL DEFAULT 22.00;

-- Pre-discount unit price at order time (products.compare_at_price when it is
-- above the price paid). NULL = sold at list price, no discount.
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS list_unit_price NUMERIC(10,2);

-- Shipping is invoiced as its own line with its own rate (22%, accessory to the goods).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_vat_rate NUMERIC(5,2) NOT NULL DEFAULT 22.00;

-- When payment was confirmed: Stripe webhook, or the owner marking the order paid.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
UPDATE orders SET paid_at = updated_at WHERE payment_status = 'paid' AND paid_at IS NULL;

-- tax_amount used to be subtotal * 0.22 on VAT-inclusive prices: overstated by
-- ~22% and not reconcilable with total. It is now the VAT contained in total
-- (goods + shipping, all at 22% for existing orders).
UPDATE orders SET tax_amount = ROUND(total - total / 1.22, 2);

-- Order numbers: 4 hex chars of the UUID per day could collide (UNIQUE violation
-- = lost order) and the number becomes the key the gestionale matches on.
-- A global sequence never repeats; the year is cosmetic.
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW() AT TIME ZONE 'Europe/Rome', 'YYYY') || '-'
    || LPAD(nextval('order_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
