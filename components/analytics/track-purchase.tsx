'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/fpixel'
import { LAST_ORDER_KEY, type PixelOrder } from '@/lib/analytics/order-tracking'

/**
 * Fires a Meta `Purchase` event on the checkout success page.
 *
 * The order details are read from sessionStorage (written by `CheckoutForm`
 * before the redirect) rather than the URL, so no order data leaks into query
 * params. The key is cleared after firing so a page refresh doesn't double-count.
 */
export function TrackPurchase() {
  useEffect(() => {
    let raw: string | null = null
    try {
      raw = sessionStorage.getItem(LAST_ORDER_KEY)
    } catch {
      return
    }
    if (!raw) return

    try {
      const order = JSON.parse(raw) as Partial<PixelOrder>
      const contents = order.contents ?? []
      track('Purchase', {
        content_ids: contents.map((c) => c.id),
        contents,
        content_type: 'product',
        num_items: order.numItems,
        value: order.value,
        currency: order.currency ?? 'EUR',
      })
    } catch {
      // malformed payload — nothing to report
    }

    try {
      sessionStorage.removeItem(LAST_ORDER_KEY)
    } catch {
      // ignore
    }
  }, [])

  return null
}
