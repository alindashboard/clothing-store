import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Link } from '@/i18n/navigation'
import { MapPin } from 'lucide-react'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductBadge } from '@/components/product/product-badge'
import { ProductGrid } from '@/components/product/product-grid'
import { getProduct, getProducts } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'
import { STORE_INFO } from '@/lib/store-info'
import { formatPrice } from '@/lib/utils'
import { getAlternates } from '@/lib/seo/alternates'
import { ProductDetailClient } from './product-detail-client'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: SITE_CONFIG.brand.name }

  const images = product.images ?? []
  const firstImage = images.find((i) => i.is_primary) ?? images[0]
  const ogImageUrl = firstImage?.url ?? `${SITE_CONFIG.brand.url}/og-image.jpg`

  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.short_description || undefined,
    alternates: getAlternates(locale, `/product/${slug}`),
    openGraph: {
      type: 'website',
      title: product.meta_title || product.name,
      description: product.meta_description || product.short_description || undefined,
      images: [{ url: ogImageUrl, width: 1200, height: 1200, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImageUrl],
    },
    other: {
      'og:price:amount': String(product.base_price),
      'og:price:currency': 'EUR',
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params
  const [product, categories, t, tStore, tCommon] = await Promise.all([
    getProduct(slug),
    getCategories(),
    getTranslations('product'),
    getTranslations('store'),
    getTranslations('common'),
  ])

  if (!product) notFound()

  const variants = product.variants ?? []
  const images = product.images ?? []
  const activeVariants = variants.filter((v) => v.is_active)
  const isOutOfStock = activeVariants.length > 0 && activeVariants.every((v) => v.stock_quantity <= 0)

  const related = product.category
    ? (await getProducts({ categorySlug: product.category.slug, limit: 5 }))
        .filter((p) => p.id !== product.id)
        .slice(0, 4)
    : []

  const siteUrl = SITE_CONFIG.brand.url
  const productUrl = `${siteUrl}/${locale}/product/${slug}`

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.short_description,
    sku: product.sku_prefix,
    brand: { '@type': 'Brand', name: SITE_CONFIG.brand.name },
    url: productUrl,
    image: images.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      price: product.base_price,
      priceCurrency: 'EUR',
      availability: isOutOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: productUrl,
      seller: { '@type': 'Organization', name: SITE_CONFIG.brand.name },
    },
  }

  const breadcrumbItems: { name: string; item: string }[] = [
    { name: 'Home', item: `${siteUrl}/${locale}` },
  ]
  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      item: `${siteUrl}/${locale}/category/${product.category.slug}`,
    })
  }
  breadcrumbItems.push({ name: product.name, item: productUrl })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="bg-[#141412] flex-1 pb-24 md:pb-0">
        {/* Breadcrumb */}
        <div
          className="max-w-7xl mx-auto px-4 pt-6 text-xs tracking-wide"
          style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: '#6b6862' }}
        >
          <Link href="/" className="hover:text-[#c7c3b8] transition-colors">{t('breadcrumbHome')}</Link>
          {product.category && (
            <>
              <span className="mx-2" style={{ color: '#3a3833' }}>/</span>
              <Link href={`/category/${product.category.slug}`} className="hover:text-[#c7c3b8] transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span className="mx-2" style={{ color: '#3a3833' }}>/</span>
          <span style={{ color: '#c7c3b8' }}>{product.name}</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <ProductGallery images={images} productName={product.name} />

          <div>
            {product.category && (
              <p
                className="text-xs tracking-[0.25em] uppercase mb-3.5"
                style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {product.category.name}
              </p>
            )}

            <div className="flex items-center gap-3.5 mb-4">
              <h1
                className="font-black leading-[1.05] text-[#EDE9E1]"
                style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: 'clamp(26px, 3vw, 42px)', letterSpacing: '-0.02em' }}
              >
                {product.name}
              </h1>
              {isOutOfStock && <ProductBadge type="out-of-stock" variant="dark" />}
              {!isOutOfStock && product.is_new && <ProductBadge type="new" variant="dark" />}
              {product.compare_at_price && <ProductBadge type="sale" variant="dark" />}
            </div>

            <div
              className="font-bold mb-5 flex items-baseline gap-3"
              style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: '26px', color: '#EDE9E1' }}
            >
              {formatPrice(product.base_price)}
              {product.compare_at_price && product.compare_at_price > product.base_price && (
                <span className="line-through font-normal" style={{ fontSize: '17px', color: '#6b6862' }}>
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>

            {product.short_description && (
              <p className="text-sm leading-relaxed mb-9 max-w-[460px]" style={{ color: '#a9a598' }}>
                {product.short_description}
              </p>
            )}

            <ProductDetailClient product={product} variants={variants} images={images} />

            {product.description && (
              <div className="border-t mt-7" style={{ borderColor: '#2B2924' }}>
                <details className="group">
                  <summary
                    className="flex items-center justify-between py-5 cursor-pointer list-none"
                    style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
                  >
                    <span className="font-semibold text-xs tracking-[1.5px]" style={{ color: '#EDE9E1' }}>
                      {t('description').toUpperCase()}
                    </span>
                    <span className="group-open:rotate-45 transition-transform text-lg leading-none" style={{ color: '#8C8577' }}>+</span>
                  </summary>
                  <p className="pb-6 text-[13px] leading-[1.9]" style={{ color: '#a9a598' }}>{product.description}</p>
                </details>
              </div>
            )}

            {product.sku_prefix && (
              <p
                className="text-[11px] tracking-wide pt-4 mb-7 border-t"
                style={{ color: '#5a5852', borderColor: '#2B2924', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {t('sku')}: {product.sku_prefix}
              </p>
            )}

            <div className="flex gap-3 items-start p-5" style={{ border: '1px solid #2B2924' }}>
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: SITE_CONFIG.brand.darkAccent }} aria-hidden="true" />
              <div>
                <p className="text-sm mb-1" style={{ color: '#c7c3b8' }}>{t('availableInStore')}</p>
                <a
                  href={STORE_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] tracking-wide hover:opacity-80 transition-opacity"
                  style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
                >
                  {tStore('getDirections')} →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-20">
            <div className="flex items-baseline justify-between mb-9">
              <h2
                className="font-black text-[#EDE9E1]"
                style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: 'clamp(22px, 2.4vw, 32px)' }}
              >
                {t('relatedTitle')}
              </h2>
              <Link
                href="/products"
                className="text-xs tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
                style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {tCommon('viewAll')} →
              </Link>
            </div>
            <ProductGrid products={related} columns={4} variant="dark" />
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
