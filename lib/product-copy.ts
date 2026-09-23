import type { Product } from '@/lib/types'

/** Locale-aware product copy: English when filled in, otherwise the Italian default. */
export function productCopy(
  product: Pick<Product, 'description' | 'short_description' | 'description_en' | 'short_description_en'>,
  locale: string,
) {
  const en = locale === 'en'
  return {
    shortDescription: (en && product.short_description_en) || product.short_description,
    description: (en && product.description_en) || product.description,
  }
}
