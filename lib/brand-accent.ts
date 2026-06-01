import { SITE_CONFIG } from './config'

/**
 * Resolves the active brand accent color.
 *
 * Currently reads from SITE_CONFIG. Once the admin dashboard "Brand settings"
 * page is built, this function will query the `site_settings` Supabase table
 * for a stored override and fall back to the config default only if none exists.
 *
 * Usage (Server Component or layout):
 *   const accent = await getBrandAccent()
 *
 * The returned hex string is injected as the `--brand-accent` CSS custom
 * property on <html>, so every component can reference it via:
 *   style={{ color: 'var(--brand-accent)' }}
 */
export async function getBrandAccent(): Promise<string> {
  // ── Future: admin-dashboard DB override ─────────────────────────────────
  // Uncomment and adapt once the `site_settings` table is created:
  //
  // import { createSupabaseServerClient } from './supabase-server'
  // const supabase = await createSupabaseServerClient()
  // const { data } = await supabase
  //   .from('site_settings')
  //   .select('value')
  //   .eq('key', 'brand_accent')
  //   .maybeSingle()
  // if (data?.value) return data.value as string
  // ────────────────────────────────────────────────────────────────────────

  return SITE_CONFIG.brand.accent
}

/** All available accent swatch options (for the admin picker UI). */
export const ACCENT_OPTIONS = SITE_CONFIG.brand.accentOptions
