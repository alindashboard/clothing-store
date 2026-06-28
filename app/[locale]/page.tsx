import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { MarqueeTicker } from '@/components/layout/marquee-ticker'
import { Footer } from '@/components/layout/footer'
import { ProductGrid } from '@/components/product/product-grid'
import { getProducts, getCategoryImages } from '@/lib/actions/products'
import { getCategories, getCategoriesForLanding } from '@/lib/actions/categories'
import { CategoryImageSlider } from '@/components/layout/category-image-slider'
import { VisitUsSection } from '@/components/layout/visit-us-section'
import { InstagramSection } from '@/components/layout/instagram-section'
import { SITE_CONFIG } from '@/lib/config'
import { getSiteSettings } from '@/lib/brand-accent'
import { TESTIMONIALS } from '@/lib/testimonials'
import { getNewArrivals } from '@/lib/actions/new-arrivals'
import { AnimatedNewArrivalsText } from '@/components/AnimatedNewArrivalsText'
import { NewArrivalsCarousel } from '@/components/NewArrivalsCarousel'

export const metadata: Metadata = {
  title: `${SITE_CONFIG.brand.name} — ${SITE_CONFIG.brand.tagline}`,
  description: SITE_CONFIG.brand.tagline,
}

export default async function HomePage() {
  const [categories, landingCategories, featuredProducts, settings, newArrivals, t] = await Promise.all([
    getCategories(),
    getCategoriesForLanding(),
    getProducts({ featured: true, limit: 8 }),
    getSiteSettings(),
    getNewArrivals(),
    getTranslations('home'),
  ])

  const categoryImages = await getCategoryImages(landingCategories.map((c) => c.id))
  const newArrivalProducts = newArrivals.map((a) => a.product)

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1">
        <h1 className="sr-only">{t('heroTitle')}</h1>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section
          className="kaya-hero relative overflow-hidden"
          style={{ background: '#0b0b0c' }}
        >
          {/* Mobile layout */}
          <div className="md:hidden flex flex-col items-center pt-8 pb-10 px-6 text-center relative z-10">
            <Image
              src="/kaya-logo.png"
              alt="KAYA Studio Outlet"
              width={996}
              height={1253}
              priority
              className="w-[60vw] max-w-[200px] h-auto"
            />
            <p
              className="mt-6 text-base font-light"
              style={{
                fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
                fontStyle: 'italic',
                color: 'rgba(236,230,218,0.55)',
              }}
            >
              {settings.tagline}
            </p>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:block relative h-[500px]">
            <div className="absolute inset-0 z-0">
              <Image
                src="/hero-nou-kaya.png"
                alt="KAYA Studio Outlet"
                fill
                priority
                sizes="100vw"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>

            <div className="absolute bottom-10 left-6 right-6 z-10">
              <div className="max-w-6xl mx-auto grid grid-cols-3 items-end gap-6">
                <div>
                  <p
                    className="text-xs mb-3 tracking-[0.3em] uppercase"
                    style={{ color: settings.accent, fontFamily: 'var(--font-sans)' }}
                  >
                    {settings.heroSeasonLabel}
                  </p>
                  <p
                    className="text-lg leading-snug"
                    style={{
                      fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
                      fontWeight: 400,
                      color: '#ece6da',
                      maxWidth: 320,
                    }}
                  >
                    {settings.tagline}
                  </p>
                </div>

                <div className="flex justify-center">
                  <Link
                    href={settings.heroCtaUrl}
                    className="inline-flex items-center gap-3 text-xs font-medium tracking-[0.24em] uppercase px-10 py-4 transition-opacity hover:opacity-80"
                    style={{
                      background: settings.accent,
                      color: '#0b0b0c',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {settings.heroCtaText} <span style={{ fontSize: 15 }}>→</span>
                  </Link>
                </div>

                <div className="flex justify-end">
                  <p
                    className="text-xs tracking-[0.22em] uppercase"
                    style={{ color: 'rgba(236,230,218,0.55)', fontFamily: 'var(--font-sans)' }}
                  >
                    ↓ Scroll
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TICKER ────────────────────────────────────────────────────── */}
        {settings.tickerEnabled && (
          <MarqueeTicker settings={settings} accent={settings.accent} />
        )}

        {/* ── NEW ARRIVALS ───────────────────────────────────────────────── */}
        {newArrivalProducts.length > 0 && (
          <section className="py-14 overflow-hidden">
            <div className="text-center mb-8 px-4">
              <AnimatedNewArrivalsText size="lg" />
            </div>
            <NewArrivalsCarousel products={newArrivalProducts} />
            <div className="text-center mt-8">
              <Link
                href="/new-arrivals"
                className="text-xs font-medium tracking-[0.2em] uppercase text-gray-500 hover:text-black transition-colors underline underline-offset-4"
              >
                {t('viewAllNewArrivals')}
              </Link>
            </div>
          </section>
        )}

        {/* ── CATEGORIES ────────────────────────────────────────────────── */}
        {landingCategories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl md:text-4xl font-light tracking-tight">{t('shopByCategory')}</h2>
              <Link href="/products" className="text-xs tracking-widest uppercase text-gray-500 hover:text-black transition-colors hidden md:block">
                {t('allProducts')}
              </Link>
            </div>
            <div className={`grid gap-4 ${
              landingCategories.length === 1 ? 'grid-cols-1' :
              landingCategories.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 md:grid-cols-3'
            }`}>
              {landingCategories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group relative aspect-[3/4] bg-gray-100 overflow-hidden block"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    {(categoryImages[cat.id]?.length ?? 0) > 0 ? (
                      <CategoryImageSlider
                        images={categoryImages[cat.id]}
                        alt={cat.name}
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background: i === 0
                            ? 'linear-gradient(135deg, #1a1a1d 0%, #2d2d30 100%)'
                            : i === 1
                            ? 'linear-gradient(135deg, #2a2a2d 0%, #1a1a1d 100%)'
                            : 'linear-gradient(135deg, #222225 0%, #2a2a2d 100%)',
                        }}
                      />
                    )}
                  </div>
                  <div
                    className="absolute top-4 left-4 z-20 text-xs tracking-widest uppercase px-2.5 py-1.5"
                    style={{
                      color: settings.accent,
                      border: `1px solid ${settings.accent}40`,
                      background: 'rgba(11,11,12,0.6)',
                      backdropFilter: 'blur(4px)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    0{i + 1}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
                    <p
                      className="text-xs tracking-widest uppercase mb-2 opacity-70"
                      style={{ color: settings.accent }}
                    >
                      {t('collection')}
                    </p>
                    <div className="flex items-end justify-between">
                      <p className="text-white text-2xl font-light">{cat.name}</p>
                      <span className="text-white opacity-60 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── FEATURED PRODUCTS ─────────────────────────────────────────── */}
        {featuredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8 pb-20">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="text-xl font-light tracking-wider">{t('featured')}</h2>
              <Link href="/products" className="text-xs tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                {t('viewAllFeatured')}
              </Link>
            </div>
            <ProductGrid products={featuredProducts} columns={4} />
          </section>
        )}

        {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-16 pb-20">
          <h2
            className="text-2xl md:text-3xl font-light tracking-tight mb-10"
            style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
          >
            {t('testimonials')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <p
                  className="text-lg leading-relaxed text-gray-800 mb-6"
                  style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)', fontStyle: 'italic' }}
                >
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'var(--font-sans)' }}>
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                    {testimonial.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <VisitUsSection />
      <InstagramSection />
      <Footer />
    </>
  )
}
