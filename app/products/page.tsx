import type { Metadata } from 'next'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductGrid } from '@/components/product/product-grid'
import { getProducts } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'
import Link from 'next/link'

export const metadata: Metadata = {
  title: `All Products | ${SITE_CONFIG.brand.name}`,
  description: 'Browse our complete collection',
}

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ])

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 py-10 flex-1">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-wider">All Products</h1>
            <p className="text-sm text-gray-400 mt-1">{products.length} items</p>
          </div>
          {/* Category filter */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/products" className="text-xs tracking-widest uppercase text-black border-b border-black pb-0.5">All</Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="text-xs tracking-widest uppercase text-gray-500 hover:text-black transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <ProductGrid products={products} columns={4} />
      </main>

      <Footer />
    </>
  )
}
