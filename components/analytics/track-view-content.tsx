'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics/fpixel'

interface Props {
  id: string
  name: string
  category?: string
  value: number
  currency: string
}

/** Fires a Meta `ViewContent` event on the product detail page. */
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
  }, [id, name, category, value, currency])

  return null
}
