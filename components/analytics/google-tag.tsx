'use client'

import Script from 'next/script'
import { useConsent } from '@/components/consent/consent-context'
import { GA_MEASUREMENT_ID } from '@/lib/analytics/gtag'
import { isInternalVisitor } from '@/lib/analytics/internal-visitor'

/**
 * Loads the Google tag (GA4) only once the visitor has granted cookie consent,
 * same gate as the Meta Pixel. Because the tag never loads without consent,
 * the Consent Mode v2 signals are all `granted` — Google Ads requires them to
 * be sent explicitly for EEA traffic.
 *
 * No manual page_view on route changes: GA4's enhanced measurement already
 * records App Router navigations via the History API, so adding our own would
 * double-count. The owner's own devices never load the tag at all.
 */
export function GoogleTag() {
  const { consent } = useConsent()
  // consent is null on the server and the first client paint, so the
  // localStorage read below only happens after hydration.
  const enabled = Boolean(GA_MEASUREMENT_ID) && consent === 'granted' && !isInternalVisitor()

  if (!enabled) return null

  return (
    <>
      <Script
        id="google-tag-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted'
});
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  )
}
