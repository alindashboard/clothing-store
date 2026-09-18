-- First-party site analytics (visits + on-site actions), separate from the
-- consent-gated Meta Pixel. Cookieless by design: no persistent visitor id is
-- stored, just a daily-rotating hash for rough unique-visitor counts, so this
-- table is written and read without needing cookie consent.
--
-- Writes only ever happen server-side from app/api/analytics/route.ts using
-- the service-role client (lib/supabase.ts -> createSupabaseAdminClient),
-- which bypasses RLS — the browser never talks to this table directly, so
-- there is no anon insert policy to abuse. RLS is enabled with zero policies:
-- deny-all for the anon/authenticated keys, admin reads go through the same
-- service-role client in lib/actions/analytics.ts.

CREATE TABLE IF NOT EXISTS analytics_events (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event         TEXT NOT NULL,
  path          TEXT,
  locale        TEXT,
  referrer      TEXT,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  category      TEXT,
  payment_method TEXT,
  value         NUMERIC,
  device        TEXT,
  country       TEXT,
  -- sha256(ip + user-agent + salt + UTC date), truncated — rotates daily so it
  -- can't be used to track a visitor across days, just to approximate "how many
  -- distinct visitors today". Never derived from anything we persist elsewhere.
  visitor_hash  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS analytics_events_event_created_at_idx ON analytics_events (event, created_at);
CREATE INDEX IF NOT EXISTS analytics_events_product_id_idx ON analytics_events (product_id) WHERE product_id IS NOT NULL;

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
-- No policies: anon/authenticated keys get zero access. Only the service-role
-- client (which bypasses RLS) reads or writes this table.
