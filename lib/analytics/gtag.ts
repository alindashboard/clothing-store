/**
 * Google tag (GA4) helpers.
 *
 * Mirrors `fpixel.ts`: gtag.js is injected only after the visitor grants
 * cookie consent (see `components/analytics/google-tag.tsx`), so every call
 * here is a no-op until `window.gtag` exists. The owner's own devices are
 * skipped too (see `internal-visitor.ts`).
 *
 * Events use the GA4 recommended e-commerce names (view_item, add_to_cart,
 * begin_checkout, purchase) so GA4 fills its e-commerce reports on its own and
 * `purchase` can be marked a key event and imported into Google Ads as the
 * conversion. `purchase` carries `transaction_id` (the order number), which
 * GA4 uses to drop duplicates if the success page is reloaded.
 *
 * `item_id` is the Supabase product UUID, same as the Meta `content_ids`.
 */
import { isInternalVisitor } from './internal-visitor'
import { SITE_CONFIG } from '@/lib/config'

export const GA_MEASUREMENT_ID = SITE_CONFIG.features.googleAnalytics
  ? SITE_CONFIG.analytics.googleMeasurementId
  : ''

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export interface GtagItem {
  item_id: string
  item_name?: string
  item_category?: string
  price: number
  quantity: number
}

/** Any GA4 event. Page views are sent by GA4 itself (enhanced measurement tracks history changes). */
export function gtagEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  if (isInternalVisitor()) return
  window.gtag('event', name, params)
}
