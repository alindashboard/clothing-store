/**
 * First-party site analytics — the event vocabulary shared between the
 * client beacon (`site-track.ts`), the ingest route (`app/api/analytics/route.ts`),
 * and the admin summary query (`lib/actions/analytics.ts`).
 *
 * Deliberately mirrors the Meta Pixel's standard events one-to-one (see
 * `lib/analytics/fpixel.ts`) so the two systems stay easy to reason about
 * together, but this one is cookieless and never gated on cookie consent —
 * no persistent visitor id is stored, see the `analytics_events` migration.
 */
export const SITE_EVENTS = [
  'page_view',
  'view_product',
  'add_to_cart',
  'checkout_start',
  'purchase',
] as const

export type SiteEvent = (typeof SITE_EVENTS)[number]

export function isSiteEvent(value: unknown): value is SiteEvent {
  return typeof value === 'string' && (SITE_EVENTS as readonly string[]).includes(value)
}

/** Payload the client beacon sends; `path`/`locale`/`referrer` are filled in by `siteTrack`. */
export interface SiteEventPayload {
  event: SiteEvent
  path?: string
  locale?: string
  referrer?: string | null
  productId?: string
  /** Category display name (not slug — matches whatever label the caller has on hand). */
  category?: string
  paymentMethod?: string
  value?: number
}
