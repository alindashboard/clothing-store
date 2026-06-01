import { SITE_CONFIG } from './config'

// ─────────────────────────────────────────────────────────────────────────────
// site_settings — single source of truth for admin-configurable design values.
//
// Architecture:
//   • All configurable values flow through getSiteSettings().
//   • Config file provides typed defaults — app never crashes if DB key missing.
//   • When admin dashboard "Brand settings" page is built, uncomment the DB
//     queries below. Each key maps 1-to-1 to a row in the site_settings table.
//   • Components never query the DB directly — always go through this module.
//
// Future DB schema (Supabase):
//   create table site_settings (
//     key   text primary key,
//     value text not null,
//     updated_at timestamptz default now()
//   );
//   -- RLS: select public, insert/update admin only.
// ─────────────────────────────────────────────────────────────────────────────

export interface SiteSettings {
  // Brand
  accent: string
  // Ticker
  tickerText: string
  tickerSeparator: string
  tickerSubtext: string
  tickerSpeed: number
  tickerEnabled: boolean
  // Hero
  heroSeasonLabel: string
  heroCtaText: string
  heroCtaUrl: string
  heroLogoSrc: string
  // Tagline (shared between hero and meta)
  tagline: string
}

/**
 * Returns all admin-configurable design settings.
 * Currently falls back entirely to SITE_CONFIG defaults.
 * Once the admin UI is built, DB values override config values key by key.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  // ── Future: DB overrides (uncomment when site_settings table exists) ─────
  // const supabase = await createSupabaseServerClient()
  // const { data: rows } = await supabase.from('site_settings').select('key,value')
  // const db: Record<string, string> = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))
  // const get = (key: string, fallback: string) => db[key] ?? fallback
  // ─────────────────────────────────────────────────────────────────────────

  const b = SITE_CONFIG.brand
  return {
    accent:           b.accent,
    tickerText:       b.ticker.text,
    tickerSeparator:  b.ticker.separator,
    tickerSubtext:    b.ticker.subtext,
    tickerSpeed:      b.ticker.speed,
    tickerEnabled:    b.ticker.enabled,
    heroSeasonLabel:  b.hero.seasonLabel,
    heroCtaText:      b.hero.ctaText,
    heroCtaUrl:       b.hero.ctaUrl,
    heroLogoSrc:      b.hero.logoSrc,
    tagline:          b.tagline,
  }
}

/**
 * Convenience: just the accent hex string (used in root layout).
 * Calls getSiteSettings() internally — no extra DB round-trip if cached.
 */
export async function getBrandAccent(): Promise<string> {
  const s = await getSiteSettings()
  return s.accent
}

/** All available accent swatch options (for the admin picker UI). */
export const ACCENT_OPTIONS = SITE_CONFIG.brand.accentOptions
