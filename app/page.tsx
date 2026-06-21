import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
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

export const metadata: Metadata = {
  title: `${SITE_CONFIG.brand.name} — ${SITE_CONFIG.brand.tagline}`,
  description: SITE_CONFIG.brand.tagline,
}

export default async function HomePage() {
  const [categories, landingCategories, featuredProducts, settings] = await Promise.all([
    getCategories(),
    getCategoriesForLanding(),
    getProducts({ featured: true, limit: 8 }),
    getSiteSettings(),
  ])

  const categoryImages = await getCategoryImages(landingCategories.map((c) => c.id))

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section
          className="kaya-hero relative overflow-hidden flex items-center justify-center min-h-[50vh] md:h-[500px] md:min-h-0"
          style={{ background: '#0b0b0c' }}
        >
          {/* Desktop: full-bleed background image (logo + visuals baked in) */}
          <div className="hidden md:block absolute inset-0 z-0">
            <Image
              src="/hero-nou-kaya.png"
              alt="KAYA Studio Outlet"
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>

          {/* Mobile only: faint giant "K" in background */}
          <div
            className="md:hidden absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            aria-hidden="true"
          >
            <span
              style={{
                fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
                fontWeight: 600,
                fontSize: 'clamp(280px, 40vw, 520px)',
                lineHeight: 1,
                color: 'rgba(236,230,218,0.025)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              K
            </span>
          </div>

          {/* Bottom row: season label | CTA button | scroll hint */}
          <div className="absolute bottom-10 left-6 right-6 z-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 items-end gap-6">
              {/* Left: season + tagline */}
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

              {/* Center: CTA */}
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

              {/* Right: scroll hint */}
              <div className="hidden md:flex justify-end">
                <p
                  className="text-xs tracking-[0.22em] uppercase"
                  style={{ color: 'rgba(236,230,218,0.55)', fontFamily: 'var(--font-sans)' }}
                >
                  ↓ Scroll
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── TICKER ────────────────────────────────────────────────────── */}
        {settings.tickerEnabled && (
          <MarqueeTicker settings={settings} accent={settings.accent} />
        )}

        {/* ── CATEGORIES ────────────────────────────────────────────────── */}
        {landingCategories.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl md:text-4xl font-light tracking-tight">Shop by category</h2>
              <Link href="/products" className="text-xs tracking-widest uppercase text-gray-500 hover:text-black transition-colors hidden md:block">
                All products →
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
                  {/* Category images — carousel if multiple, single image, or dark gradient fallback */}
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
                  {/* Category number badge */}
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
                      Collection
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
              <h2 className="text-xl font-light tracking-wider">Featured</h2>
              <Link href="/products" className="text-xs tracking-widest uppercase text-gray-500 hover:text-black transition-colors">
                View All →
              </Link>
            </div>
            <ProductGrid products={featuredProducts} columns={4} />
          </section>
        )}
      </main>

      <VisitUsSection />
      <InstagramSection />
      <Footer />
    </>
  )
}
