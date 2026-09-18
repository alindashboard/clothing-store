'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics/fpixel'
import { siteTrack } from '@/lib/analytics/site-track'
import type { CartItem } from '@/lib/store/cart'

interface Props {
  items: CartItem[]
  value: number
  currency: string
}

/** Fires a Meta `InitiateCheckout` and a first-party `checkout_start` event once when the checkout page loads with items. */
export function TrackInitiateCheckout({ items, value, currency }: Props) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || items.length === 0) return
    fired.current = true
    track('InitiateCheckout', {
      content_ids: items.map((i) => i.productId),
      contents: items.map((i) => ({ id: i.productId, quantity: i.quantity, item_price: i.price })),
      content_type: 'product',
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      value,
      currency,
    })
    siteTrack('checkout_start', { value })
  }, [items, value, currency])

  return null
}
