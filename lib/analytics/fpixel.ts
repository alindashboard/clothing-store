/**
 * Facebook (Meta) Pixel helpers.
 *
 * The pixel library is injected only after the visitor grants cookie consent
 * (see `components/consent/` and `components/analytics/facebook-pixel.tsx`), so
 * every function here is a deliberate no-op until then: `window.fbq` is
 * undefined pre-consent and the call is silently dropped. No consent -> no
 * tracking, by construction.
 *
 * `content_ids` currently use the Supabase product UUID. When a Meta product
 * catalog / feed is set up, these must be aligned with whatever id the feed
 * uses (most likely `sku_prefix`) or dynamic ads / catalog matching will miss.
 */
import { SITE_CONFIG } from '@/lib/config'

export const FB_PIXEL_ID = SITE_CONFIG.features.facebookPixel
  ? SITE_CONFIG.analytics.facebookPixelId
  : ''

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string }
    _fbq?: unknown
  }
}

function call(...args: unknown[]) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  ;(window.fbq as (...a: unknown[]) => void)(...args)
}

/** Standard PageView event — fired by the pixel loader on every route change. */
export const pageview = () => call('track', 'PageView')

/** Any standard event (ViewContent, AddToCart, InitiateCheckout, Purchase, ...). */
export const track = (event: string, params?: Record<string, unknown>) =>
  params ? call('track', event, params) : call('track', event)
