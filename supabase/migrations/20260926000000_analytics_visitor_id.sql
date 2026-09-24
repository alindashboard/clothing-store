-- Persistent, consent-based visitor id (cookie `kaya_vid`, see
-- lib/analytics/visitor-cookie.ts and docs/legal/tracking-and-cookies.md).
--
-- Only visitors who accepted cookies ever get an id; everyone else keeps the
-- existing cookieless, daily-rotating visitor_hash and these columns stay NULL.
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS visitor_id UUID;
CREATE INDEX IF NOT EXISTS analytics_events_visitor_id_idx
  ON analytics_events (visitor_id, created_at) WHERE visitor_id IS NOT NULL;

-- Links an order to the browsing history of the same consented visitor, for
-- attribution (which source led to the order, visits/days before buying).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS visitor_id UUID;
CREATE INDEX IF NOT EXISTS orders_visitor_id_idx ON orders (visitor_id) WHERE visitor_id IS NOT NULL;

-- Retention (the privacy policy states these periods — keep them in sync):
--  * the id is dropped 13 months after the event/order it is attached to, so
--    browsing history cannot be linked back beyond that (orders themselves are
--    kept 10 years for tax);
--  * analytics events are deleted entirely after 25 months.
-- Called opportunistically by the admin analytics page; safe to run anytime.
CREATE OR REPLACE FUNCTION purge_expired_visitor_ids() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE analytics_events SET visitor_id = NULL
    WHERE visitor_id IS NOT NULL AND created_at < now() - interval '13 months';
  UPDATE orders SET visitor_id = NULL
    WHERE visitor_id IS NOT NULL AND created_at < now() - interval '13 months';
  DELETE FROM analytics_events WHERE created_at < now() - interval '25 months';
$$;
REVOKE ALL ON FUNCTION purge_expired_visitor_ids() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION purge_expired_visitor_ids() TO service_role;
