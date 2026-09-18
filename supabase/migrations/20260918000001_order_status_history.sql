-- Audit trail for order status changes, powering the "Timeline" card on
-- /admin/orders/[id] (previously just order.created_at / order.updated_at,
-- which can't show intermediate transitions like pending -> confirmed -> shipped).
--
-- Written only from lib/actions/orders.ts (createOrder inserts the initial
-- 'pending' row, updateOrderStatus inserts one on every actual status change)
-- via the service-role client, same access pattern as analytics_events.

CREATE TABLE IF NOT EXISTS order_status_history (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx ON order_status_history (order_id, created_at);

ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
-- No policies: anon/authenticated keys get zero access. Only the service-role
-- client (which bypasses RLS) reads or writes this table.
