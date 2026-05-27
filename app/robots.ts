import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/cart/', '/checkout/'],
      },
    ],
    sitemap: `${SITE_CONFIG.brand.url}/sitemap.xml`,
  }
}
