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
import { isInternalVisitor } from './internal-visitor'
import type { SiteEvent, SiteEventPayload } from './site-events'

export function siteTrack(event: SiteEvent, payload?: Omit<SiteEventPayload, 'event' | 'path' | 'locale' | 'referrer'>) {
  if (typeof window === 'undefined' || !SITE_CONFIG.features.siteAnalytics) return
  // The root layout wraps /admin too — don't let the owner's own admin
  // sessions pollute visitor/traffic numbers for the storefront.
  if (window.location.pathname.startsWith('/admin')) return
  // Devices that have opened /admin are the owner's own — see internal-visitor.ts.
  if (isInternalVisitor()) return

  try {
    // localePrefix: 'always' means the pathname always starts with /it/ or /en/.
    const locale = window.location.pathname.split('/')[1] || undefined
    // Campaign tags only exist on the landing URL; later client-side navigations
    // drop the query string, so they are read here and never stored on the device.
    const params = new URLSearchParams(window.location.search)
    const utm = {
      utmSource: params.get('utm_source') ?? undefined,
      utmMedium: params.get('utm_medium') ?? undefined,
      utmCampaign: params.get('utm_campaign') ?? undefined,
    }
    const body = JSON.stringify({
      event,
      path: window.location.pathname,
      locale,
      referrer: document.referrer || null,
      ...(event === 'page_view' ? utm : {}),
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
