/**
 * The consent-based persistent visitor id. Server-side only: the cookie is set
 * and cleared by /api/analytics/visitor, read by the analytics ingest route and
 * by createOrder. It is HttpOnly (no script on the page, Pixel/GA included, can
 * read it) and set by our own server on our own domain, which is what keeps it
 * alive beyond Safari's 7-day cap on script-written cookies.
 *
 * The expiry is fixed at creation and never extended on later visits, so the id
 * lives at most 13 months from the moment consent was given.
 */
export const VISITOR_COOKIE = 'kaya_vid'
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 396 // 13 months

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function parseVisitorId(value: string | undefined | null): string | null {
  return value && UUID_RE.test(value) ? value.toLowerCase() : null
}
