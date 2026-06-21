-- =============================================
-- EVENTS table
-- =============================================
CREATE TABLE events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  slug         TEXT        NOT NULL UNIQUE,
  description  TEXT,
  event_date   TIMESTAMPTZ NOT NULL,
  location     TEXT,
  is_online    BOOLEAN     NOT NULL DEFAULT false,
  image_url    TEXT,
  cta_label    TEXT,
  cta_url      TEXT,
  status       TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_status     ON events(status);
CREATE INDEX idx_events_slug       ON events(slug);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_events_updated_at();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public can read published events
CREATE POLICY "Events public read"
  ON events FOR SELECT
  USING (status = 'published');

-- Authenticated (admin) has full access
CREATE POLICY "Events admin full access"
  ON events FOR ALL
  USING (auth.role() = 'authenticated');
