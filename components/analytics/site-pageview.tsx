'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { siteTrack } from '@/lib/analytics/site-track'

/**
 * Fires a first-party `page_view` on first load and every client-side route
 * change. Unlike `FacebookPixel`, this is not consent-gated — see
 * lib/analytics/site-track.ts.
 */
export function SitePageView() {
  const pathname = usePathname()

  useEffect(() => {
    siteTrack('page_view')
  }, [pathname])

  return null
}
