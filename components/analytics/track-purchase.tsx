'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/fpixel'
import { gtagEvent } from '@/lib/analytics/gtag'
import { siteTrack } from '@/lib/analytics/site-track'
import { LAST_ORDER_KEY, type PixelOrder } from '@/lib/analytics/order-tracking'
import { useCartStore } from '@/lib/store/cart'

/**
 * Fires a Meta `Purchase` and a GA4 `purchase` event (the Google Ads
 * conversion) on the checkout success page, and clears the
 * cart now that the order has actually landed here.
 *
 * Clearing used to happen in `CheckoutForm` right before the redirect, which
 * raced `CheckoutPageClient`'s "cart is empty, bounce to /cart" effect on the
 * still-mounted /checkout page — the two competing navigations could leave
 * the browser stuck on /checkout rendering nothing. Clearing only once we're
 * already on /checkout/success removes the race.
 *
 * The order details are read from sessionStorage (written by `CheckoutForm`
 * before the redirect) rather than the URL, so no order data leaks into query
 * params. The key is cleared after firing so a page refresh doesn't double-count.
 *
 * Stripe is the exception: payment isn't confirmed at redirect time, so
 * `CheckoutForm` never stashes anything for it — instead the success page
 * passes `stripeOrder`, already resolved server-side from the DB's
 * `payment_status`, and we fire straight from that instead of sessionStorage.
 */
/**
 * `transaction_id` lets GA4 drop duplicates, which matters for Stripe: that
 * path re-fires on every reload of the success page.
 */
function gtagPurchase(order: Partial<PixelOrder>) {
  if (!order.orderNumber) return
  gtagEvent('purchase', {
    transaction_id: order.orderNumber,
    value: order.value,
    currency: order.currency ?? 'EUR',
    items: (order.contents ?? []).map((c) => ({ item_id: c.id, price: c.item_price, quantity: c.quantity })),
  })
}

export function TrackPurchase({ stripeOrder }: { stripeOrder?: PixelOrder } = {}) {
  const clearCart = useCartStore((state) => state.clearCart)

  useEffect(() => {
    clearCart()

    if (stripeOrder) {
      track('Purchase', {
        content_ids: stripeOrder.contents.map((c) => c.id),
        contents: stripeOrder.contents,
        content_type: 'product',
        num_items: stripeOrder.numItems,
        value: stripeOrder.value,
        currency: stripeOrder.currency,
      })
      gtagPurchase(stripeOrder)
      siteTrack('purchase', { value: stripeOrder.value, paymentMethod: stripeOrder.paymentMethod })
      return
    }

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
      gtagPurchase(order)
      siteTrack('purchase', { value: order.value, paymentMethod: order.paymentMethod })
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
