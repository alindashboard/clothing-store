-- Campaign tags from the landing URL (?utm_source=...). Captured only on the
-- page_view of the landing page — the query string is not stored anywhere
-- else and nothing is kept on the visitor's device; the rest of the visit is
-- tied to it through the same-day visitor_hash, as before.
ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS utm_source   TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium   TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
