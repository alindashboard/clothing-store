import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { getAlternates } from '@/lib/seo/alternates'
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

interface MetaProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MetaProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: { absolute: `${SITE_CONFIG.brand.name} — ${SITE_CONFIG.brand.tagline}` },
    description: SITE_CONFIG.brand.tagline,
    alternates: getAlternates(locale, ''),
  }
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

      <main className="flex-1 bg-[#141412]">
        <h1 className="sr-only">{t('heroTitle')}</h1>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section
          className="kaya-hero relative overflow-hidden"
          style={{ background: '#141412' }}
        >
          {/* Mobile layout */}
          <div className="md:hidden flex flex-col items-center pt-8 pb-10 px-6 text-center relative">
            <div className="absolute inset-0 z-0">
              <Image
                src="/hero-mobile-kaya.webp"
                alt=""
                fill
                priority
                sizes="100vw"
                style={{ objectFit: 'cover', objectPosition: 'center bottom' }}
              />
            </div>
            <Image
              src="/kaya-logo.png"
              alt="KAYA Studio Outlet"
              width={1024}
              height={1478}
              priority
              className="relative z-10 w-[60vw] max-w-[200px] h-auto"
            />
            <p
              className="relative z-10 mt-6 text-base font-light"
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
                src="/hero-bg-kaya.webp"
                alt=""
                fill
                priority
                sizes="100vw"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>

            {/* Overlaid logo (background image is logo-free by design) */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Image
                src="/kaya-logo.png"
                alt="KAYA Studio Outlet"
                width={1024}
                height={1478}
                priority
                className="h-[340px] w-auto"
              />
            </div>

            <div className="absolute bottom-10 left-6 right-6 z-10">
              <div className="max-w-6xl mx-auto grid grid-cols-3 items-end gap-6">
                <div>
                  <p
                    className="text-xs mb-3 tracking-[0.3em] uppercase"
                    style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
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
                    className="inline-flex items-center gap-4 group"
                  >
                    <span
                      className="relative px-6 py-3.5 text-xs font-semibold tracking-[0.24em] uppercase transition-opacity group-hover:opacity-80"
                      style={{ color: '#EDE9E1', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
                    >
                      <span
                        className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
                        style={{ borderColor: SITE_CONFIG.brand.darkAccent }}
                      />
                      <span
                        className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2"
                        style={{ borderColor: SITE_CONFIG.brand.darkAccent }}
                      />
                      <span
                        className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2"
                        style={{ borderColor: SITE_CONFIG.brand.darkAccent }}
                      />
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
                        style={{ borderColor: SITE_CONFIG.brand.darkAccent }}
                      />
                      {settings.heroCtaText}
                    </span>
                    <span
                      className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-1"
                      style={{ background: SITE_CONFIG.brand.darkAccent }}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#141412" strokeWidth="2.4" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </Link>
                </div>

                <div className="flex justify-end">
                  <p
                    className="text-xs tracking-[0.22em] uppercase"
                    style={{ color: 'rgba(236,230,218,0.55)', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
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
          <MarqueeTicker settings={settings} accent={SITE_CONFIG.brand.darkAccent} />
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
                className="text-xs font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-80"
                style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
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
              <h2
                className="text-2xl md:text-4xl font-black tracking-tight text-[#EDE9E1]"
                style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
              >
                {t('shopByCategory')}
              </h2>
              <Link
                href="/products"
                className="text-xs tracking-widest uppercase hidden md:block transition-opacity hover:opacity-80"
                style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
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
                      color: SITE_CONFIG.brand.darkAccent,
                      border: `1px solid ${SITE_CONFIG.brand.darkAccent}40`,
                      background: 'rgba(11,11,12,0.6)',
                      backdropFilter: 'blur(4px)',
                      fontFamily: 'var(--font-grotesk, var(--font-sans))',
                    }}
                  >
                    0{i + 1}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
                    <p
                      className="text-xs tracking-widest uppercase mb-2 opacity-70"
                      style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
                    >
                      {t('collection')}
                    </p>
                    <div className="flex items-end justify-between">
                      <p
                        className="text-[#EDE9E1] text-2xl font-bold"
                        style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
                      >
                        {cat.name}
                      </p>
                      <span className="text-[#EDE9E1] opacity-60 group-hover:opacity-100 transition-opacity">→</span>
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
              <h2
                className="text-xl font-black tracking-wider text-[#EDE9E1]"
                style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
              >
                {t('featured')}
              </h2>
              <Link
                href="/products"
                className="text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
                style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {t('viewAllFeatured')}
              </Link>
            </div>
            <ProductGrid products={featuredProducts} columns={4} variant="dark" />
          </section>
        )}

        {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-16 pb-20">
          <h2
            className="text-2xl md:text-3xl font-black tracking-tight mb-10 text-[#EDE9E1]"
            style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
          >
            {t('testimonials')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className="bg-[#1B1917] border border-[#2B2924] rounded-none p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
              >
                <div
                  className="text-5xl leading-none mb-3"
                  style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-archivo, var(--font-sans))' }}
                >
                  &ldquo;
                </div>
                <p
                  className="text-sm leading-relaxed text-[#c7c3b8] mb-6 italic"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {testimonial.quote}
                </p>
                <div>
                  <p className="text-sm font-medium text-[#EDE9E1]" style={{ fontFamily: 'var(--font-sans)' }}>
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-[#8C8577] mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
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
