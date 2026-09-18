'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/fpixel'
import { siteTrack } from '@/lib/analytics/site-track'

interface Props {
  id: string
  name: string
  category?: string
  value: number
  currency: string
}

/** Fires a Meta `ViewContent` event and a first-party `view_product` event on the product detail page. */
export function TrackViewContent({ id, name, category, value, currency }: Props) {
  useEffect(() => {
    track('ViewContent', {
      content_ids: [id],
      content_name: name,
      content_type: 'product',
      content_category: category,
      value,
      currency,
    })
    siteTrack('view_product', { productId: id, category, value })
  }, [id, name, category, value, currency])

  return null
}
