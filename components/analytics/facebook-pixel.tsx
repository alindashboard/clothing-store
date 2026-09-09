'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useConsent } from '@/components/consent/consent-context'
import { FB_PIXEL_ID, pageview } from '@/lib/analytics/fpixel'

/**
 * Loads the Meta Pixel base code, but only once the visitor has granted cookie
 * consent (GDPR / ePrivacy — the pixel sets cookies and sends data to Meta).
 *
 * The inline snippet fires the first `PageView` itself; this component then
 * fires one `PageView` per client-side navigation (App Router route change).
 * The first effect run is skipped so that initial load isn't double-counted.
 */
export function FacebookPixel() {
  const { consent } = useConsent()
  const pathname = usePathname()
  const enabled = Boolean(FB_PIXEL_ID) && consent === 'granted'
  const skipFirst = useRef(true)

  useEffect(() => {
    if (!enabled) return
    if (skipFirst.current) {
      skipFirst.current = false
      return
    }
    pageview()
  }, [enabled, pathname])

  if (!enabled) return null

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FB_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  )
}
