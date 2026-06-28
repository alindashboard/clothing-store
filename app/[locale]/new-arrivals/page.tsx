import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductGrid } from '@/components/product/product-grid'
import { AnimatedNewArrivalsText } from '@/components/AnimatedNewArrivalsText'
import { NewArrivalsCarousel } from '@/components/NewArrivalsCarousel'
import { getNewArrivals } from '@/lib/actions/new-arrivals'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: `New Arrivals | ${SITE_CONFIG.brand.name}`,
  description: 'Fresh drops, every week. Discover the latest curated pieces at KAYA Studio Outlet.',
}

export const dynamic = 'force-dynamic'

export default async function NewArrivalsPage() {
  const [categories, arrivals, t] = await Promise.all([
    getCategories(),
    getNewArrivals(),
    getTranslations('newArrivals'),
  ])

  const products = arrivals.map((a) => a.product)

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1">
        <section
          className="relative flex flex-col items-center justify-center py-16 px-4 text-center overflow-hidden"
          style={{ background: '#0b0b0c', minHeight: 250 }}
        >
          <AnimatedNewArrivalsText size="xl" />
          <p
            className="mt-4 text-base font-light"
            style={{
              fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
              fontStyle: 'italic',
              color: 'rgba(236,230,218,0.55)',
            }}
          >
            {t('freshDrops')}
          </p>
        </section>

        {products.length > 0 && (
          <section className="py-10 overflow-hidden">
            <NewArrivalsCarousel products={products} size="compact" />
          </section>
        )}

        <section className="max-w-7xl mx-auto px-4 py-8 pb-24">
          {products.length > 0 ? (
            <ProductGrid products={products} columns={4} />
          ) : (
            <div className="py-24 text-center">
              <p className="text-gray-400 text-sm">{t('noArrivals')}</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
