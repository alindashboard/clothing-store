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

  // Only categories without an editorial image need the product-photo fallback.
  const categoryImages = await getCategoryImages(
    landingCategories.filter((c) => !c.image_url).map((c) => c.id)
  )
  const newArrivalProducts = newArrivals.map((a) => a.product)

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1 bg-[#141412]">
        <h1 className="sr-only">{t('heroTitle')}</h1>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden h-[85vh] min-h-[560px] md:h-[90vh]">
          <div className="absolute inset-0 z-0">
            <Image
              src="/produse-2.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              style={{
                objectFit: 'cover',
                objectPosition: '38% 42%',
                filter: 'contrast(1.15) brightness(0.5) saturate(1.05)',
              }}
            />
          </div>
          <div
            className="absolute inset-0 z-0"
            style={{ background: 'linear-gradient(90deg, rgba(10,10,9,0.55) 0%, rgba(10,10,9,0.1) 55%)' }}
          />

          <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16">
            <p
              className="text-[11px] md:text-[13px] font-medium tracking-[0.3em] uppercase mb-3 md:mb-[18px]"
              style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {settings.heroSeasonLabel}
            </p>
            <h2
              className="font-black text-[#EDE9E1] max-w-[90%] md:max-w-[640px]"
              style={{
                fontFamily: 'var(--font-archivo, var(--font-sans))',
                fontSize: 'clamp(34px, 8vw, 68px)',
                letterSpacing: '-0.02em',
                lineHeight: 1.02,
              }}
            >
              {t('heroHeadline')}
            </h2>

            <Link
              href={settings.heroCtaUrl}
              className="inline-flex items-center gap-4 group mt-8 md:mt-11 w-fit"
            >
              <span
                className="relative px-5 py-3 md:px-6 md:py-3.5 text-[11px] md:text-xs font-semibold tracking-[0.24em] uppercase transition-opacity group-hover:opacity-80"
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
                className="w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-1"
                style={{ background: SITE_CONFIG.brand.darkAccent }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#141412" strokeWidth="2.4" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
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
                    {cat.image_url ? (
                      <Image
                        src={cat.image_url}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (categoryImages[cat.id]?.length ?? 0) > 0 ? (
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
