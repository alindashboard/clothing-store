import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductGridInfinite } from '@/components/product/product-grid-infinite'
import { getProductsPage } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import { buildCategoryTree } from '@/lib/category-tree'
import { getAlternates } from '@/lib/seo/alternates'
import { SITE_CONFIG } from '@/lib/config'

interface MetaProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MetaProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: t('products.title'),
    description: t('products.description'),
    alternates: getAlternates(locale, '/products'),
  }
}

export default async function ProductsPage() {
  const [categories, { products, hasMore }, t] = await Promise.all([
    getCategories(),
    getProductsPage(),
    getTranslations('product'),
  ])

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="bg-[#141412] flex-1">
        {/* Breadcrumb */}
        <div
          className="max-w-7xl mx-auto px-4 pt-6 text-xs tracking-wide"
          style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: '#6b6862' }}
        >
          <Link href="/" className="hover:text-[#c7c3b8] transition-colors">{t('breadcrumbHome')}</Link>
          <span className="mx-2" style={{ color: '#3a3833' }}>/</span>
          <span style={{ color: '#c7c3b8' }}>{t('allProducts')}</span>
        </div>

        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 pt-7 pb-9 md:pb-11 mb-9 md:mb-11 border-b" style={{ borderColor: '#2B2924' }}>
          <p
            className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-2.5 md:mb-3.5"
            style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {t('shopEyebrow')}
          </p>
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 md:gap-6">
            <h1
              className="font-black uppercase leading-none text-[#EDE9E1]"
              style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: 'clamp(34px, 4.5vw, 56px)', letterSpacing: '-0.02em' }}
            >
              {t('allProducts')}
            </h1>
            <p
              className="text-xs tracking-wide whitespace-nowrap"
              style={{ color: '#8C8577', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {products.length}{hasMore ? '+' : ''} {t('items')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 md:mt-7">
            <Link
              href="/products"
              className="text-xs tracking-widest uppercase pb-0.5 border-b"
              style={{ color: SITE_CONFIG.brand.darkAccent, borderColor: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {t('filterAll')}
            </Link>
            {/* Top-level only — the full list is ~30 entries and wraps badly. */}
            {buildCategoryTree(categories).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="text-xs tracking-widest uppercase pb-0.5 border-b border-transparent transition-colors hover:text-[#c7c3b8]"
                style={{ color: '#8C8577', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16">
          <ProductGridInfinite
            initialProducts={products}
            initialHasMore={hasMore}
            columns={4}
            variant="dark"
          />
        </div>
      </main>

      <Footer />
    </>
  )
}
