import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/config'

/**
 * Returns Next.js alternates metadata for a given locale + path.
 * path should NOT include a locale prefix (e.g. "/products", "/product/slug", "").
 * x-default points to the Italian (default) version.
 */
export function getAlternates(locale: string, path: string): Metadata['alternates'] {
  const base = SITE_CONFIG.brand.url
  const itUrl = `${base}/it${path}`
  const enUrl = `${base}/en${path}`
  const canonical = locale === 'it' ? itUrl : enUrl

  return {
    canonical,
    languages: {
      it: itUrl,
      en: enUrl,
      'x-default': itUrl,
    },
  }
}
