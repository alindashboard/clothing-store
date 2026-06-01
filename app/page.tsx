import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { MarqueeTicker } from '@/components/layout/marquee-ticker'
import { Footer } from '@/components/layout/footer'
import { ProductGrid } from '@/components/product/product-grid'
import { getProducts } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'
import { getSiteSettings } from '@/lib/brand-accent'

export const metadata: Metadata = {
  title: `${SITE_CONFIG.brand.name} — ${SITE_CONFIG.brand.tagline}`,
  description: SITE_CONFIG.brand.tagline,
}

export default async function HomePage() {
  const [categories, featuredProducts, settings] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getSiteSettings(),
  ])

  const heroCategories = categories.slice(0, 3)

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section
          className="kaya-hero kaya-hero-glow relative overflow-hidden flex items-center justify-center"
          style={{ minHeight: 680, background: '#0b0b0c' }}
        >
          {/* Faint giant "K" in background */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
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

          {/* Logo PNG centered */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full py-24 px-4">
            <div className="flex items-center justify-center">
              <Image
                src={settings.heroLogoSrc}
                alt={SITE_CONFIG.brand.name}
                width={520}
                height={320}
                priority
                className="w-[min(480px,72vw)] h-auto"
                style={{ mixBlendMode: 'lighten' }}
              />
            </div>
          </div>

          {/* Bottom row: season label | CTA button | scroll hint */}
          <div
            className="absolute bottom-10 left-6 right-6 z-10"
          >
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
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {heroCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative aspect-[3/4] bg-gray-100 overflow-hidden block"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                <div
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #d4d4d4 0%, #a8a8a8 100%)' }}
                />
                <div className="absolute bottom-0 left-0 z-20 p-6">
                  <p className="text-white text-xs tracking-widest uppercase mb-1 opacity-80">Collection</p>
                  <p className="text-white text-2xl font-light">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

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

      <Footer />
    </>
  )
}
