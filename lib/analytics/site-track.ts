/**
 * Client-side beacon for first-party site analytics. Fires a best-effort POST
 * to our own `/api/analytics` route (never third-party), so it is not gated on
 * cookie consent the way `lib/analytics/fpixel.ts` is — see the
 * `analytics_events` migration for why that's an intentional, cookieless design.
 *
 * Uses `navigator.sendBeacon` so the request survives page unload (e.g. a
 * checkout redirect right after `purchase` fires); falls back to a
 * `keepalive` fetch for the rare browser without it. Every failure mode is
 * swallowed — analytics must never break the page.
 */
import { SITE_CONFIG } from '@/lib/config'
import type { SiteEvent, SiteEventPayload } from './site-events'

export function siteTrack(event: SiteEvent, payload?: Omit<SiteEventPayload, 'event' | 'path' | 'locale' | 'referrer'>) {
  if (typeof window === 'undefined' || !SITE_CONFIG.features.siteAnalytics) return

  try {
    // localePrefix: 'always' means the pathname always starts with /it/ or /en/.
    const locale = window.location.pathname.split('/')[1] || undefined
    const body = JSON.stringify({
      event,
      path: window.location.pathname,
      locale,
      referrer: document.referrer || null,
      ...payload,
    } satisfies SiteEventPayload)

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }))
    } else {
      fetch('/api/analytics', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
    }
  } catch {
    // storage/network disabled — nothing to report
  }
}
