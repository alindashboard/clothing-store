import type { Metadata } from 'next'
import Link from 'next/link'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductGrid } from '@/components/product/product-grid'
import { getProducts } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: `${SITE_CONFIG.brand.name} — ${SITE_CONFIG.brand.tagline}`,
  description: SITE_CONFIG.brand.tagline,
}

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
  ])

  const heroCategories = categories.slice(0, 3)

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative h-[70vh] min-h-[500px] bg-[#111111] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 40%, #2a2a2a 100%)',
            }}
          />
          <div className="relative z-10 text-center text-white px-4">
            <p className="text-xs tracking-[0.4em] uppercase text-gray-400 mb-4">
              New Collection
            </p>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6">
              {SITE_CONFIG.brand.name}
            </h1>
            <p className="text-sm text-gray-400 tracking-widest uppercase mb-10">
              {SITE_CONFIG.brand.tagline}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 border border-white text-white text-xs font-medium tracking-widest uppercase px-8 py-3 hover:bg-white hover:text-black transition-all duration-300"
            >
              Shop Now
            </Link>
          </div>
        </section>

        {/* Category blocks */}
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

        {/* Featured products */}
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
