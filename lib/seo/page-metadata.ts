import type { Metadata } from 'next'
import { SITE_CONFIG } from '@/lib/config'
import { getAlternates } from '@/lib/seo/alternates'

interface PageMetadataInput {
  locale: string
  /** Path without the locale prefix: '' for home, '/products', '/product/slug'. */
  path: string
  /** Page title; the layout template appends " | KAYA Studio Outlet" unless `absoluteTitle`. */
  title: string
  absoluteTitle?: boolean
  description: string
  /** Absolute image URL; defaults to the site OG image. */
  image?: { url: string; width: number; height: number; alt: string }
}

const DEFAULT_IMAGE = {
  url: `${SITE_CONFIG.brand.url}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: SITE_CONFIG.brand.name,
}

/**
 * Complete, self-referencing metadata for a public page: title, description,
 * canonical + hreflang, and an Open Graph / Twitter block whose url is the page's
 * own canonical. Next replaces (not merges) a layout's `openGraph` when a page sets
 * one, so every page must build the full block — which is what this does. CLAUDE.md
 * rule 7: never rely on inherited canonical/OG.
 */
export function pageMetadata({ locale, path, title, absoluteTitle, description, image = DEFAULT_IMAGE }: PageMetadataInput): Metadata {
  const alternates = getAlternates(locale, path)
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_CONFIG.brand.name}`
  const isIT = locale === 'it'
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates,
    openGraph: {
      type: 'website',
      siteName: SITE_CONFIG.brand.name,
      url: alternates?.canonical as string,
      title: fullTitle,
      description,
      locale: isIT ? 'it_IT' : 'en_US',
      alternateLocale: isIT ? ['en_US'] : ['it_IT'],
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.url],
    },
  }
}
