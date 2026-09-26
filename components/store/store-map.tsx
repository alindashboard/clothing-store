'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import { useConsent } from '@/components/consent/consent-context'

interface StoreMapProps {
  embedUrl: string
  mapsUrl: string
  title: string
  accent: string
}

/**
 * Google Maps embed that only loads once the visitor has accepted cookies — the
 * iframe sets Google cookies on load. It appears on its own as soon as consent is
 * granted (the banner updates the shared context, no reload needed); otherwise a
 * placeholder offers a one-off "show map" tap for this page view, which does not
 * change the site-wide consent choice.
 */
export function StoreMap({ embedUrl, mapsUrl, title, accent }: StoreMapProps) {
  const t = useTranslations('store.map')
  const { consent, ready } = useConsent()
  const [loadedOnce, setLoadedOnce] = useState(false)

  if ((ready && consent === 'granted') || loadedOnce) {
    return (
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0, display: 'block' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={title}
      />
    )
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 px-6 text-center bg-[#141412]">
      <MapPin className="w-6 h-6" style={{ color: accent }} aria-hidden="true" />
      <p className="max-w-sm text-xs leading-relaxed text-[#8C8577]">{t('notice')}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setLoadedOnce(true)}
          className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase border transition-colors hover:bg-[#EDE9E1]/5"
          style={{ borderColor: accent, color: '#EDE9E1' }}
        >
          {t('show')}
        </button>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline underline-offset-4 text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors"
        >
          {t('open')}
        </a>
      </div>
    </div>
  )
}
