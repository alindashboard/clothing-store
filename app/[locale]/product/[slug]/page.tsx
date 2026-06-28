import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductGallery } from '@/components/product/product-gallery'
import { AddToCartButton } from '@/components/product/add-to-cart-button'
import { PriceDisplay } from '@/components/product/price-display'
import { ProductBadge } from '@/components/product/product-badge'
import { getProduct } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'
import { ProductDetailClient } from './product-detail-client'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: SITE_CONFIG.brand.name }

  return {
    title: product.meta_title || `${product.name} | ${SITE_CONFIG.brand.name}`,
    description: product.meta_description || product.short_description || undefined,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [product, categories, t] = await Promise.all([
    getProduct(slug),
    getCategories(),
    getTranslations('product'),
  ])

  if (!product) notFound()

  const variants = product.variants ?? []
  const images = product.images ?? []
  const activeVariants = variants.filter((v) => v.is_active)
  const isOutOfStock = activeVariants.length > 0 && activeVariants.every((v) => v.stock_quantity <= 0)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.short_description,
    sku: product.sku_prefix,
    offers: {
      '@type': 'Offer',
      price: product.base_price,
      priceCurrency: 'EUR',
      availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
    image: images.map((i) => i.url),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 py-10 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <ProductGallery images={images} productName={product.name} />

          <div className="space-y-6">
            {product.category && (
              <p className="text-xs text-gray-400 tracking-widest uppercase">{product.category.name}</p>
            )}

            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-light leading-snug">{product.name}</h1>
              <div className="flex flex-col gap-1 mt-1">
                {isOutOfStock && <ProductBadge type="out-of-stock" />}
                {!isOutOfStock && product.is_new && <ProductBadge type="new" />}
                {product.compare_at_price && <ProductBadge type="sale" />}
              </div>
            </div>

            <PriceDisplay
              price={product.base_price}
              compareAtPrice={product.compare_at_price}
              size="lg"
            />

            {product.short_description && (
              <p className="text-sm text-gray-600 leading-relaxed">{product.short_description}</p>
            )}

            <ProductDetailClient product={product} variants={variants} images={images} />

            {product.description && (
              <div className="border-t border-gray-100 pt-6">
                <details className="group">
                  <summary className="text-xs font-semibold tracking-widest uppercase cursor-pointer flex items-center justify-between text-gray-700 hover:text-black">
                    {t('description')}
                    <span className="group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                  </summary>
                  <p className="mt-4 text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </details>
              </div>
            )}

            {product.sku_prefix && (
              <p className="text-xs text-gray-400">{t('sku')}: {product.sku_prefix}</p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
