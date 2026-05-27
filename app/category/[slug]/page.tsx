import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductGrid } from '@/components/product/product-grid'
import { getProducts } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { SITE_CONFIG } from '@/lib/config'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: cat } = await supabase.from('categories').select('name').eq('slug', slug).single()
  return {
    title: cat ? `${cat.name} | ${SITE_CONFIG.brand.name}` : SITE_CONFIG.brand.name,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: category } = await supabase.from('categories').select('*').eq('slug', slug).single()

  if (!category) notFound()

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: slug }),
  ])

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 py-10 flex-1">
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-wider">{category.name}</h1>
          {category.description && (
            <p className="text-sm text-gray-400 mt-1">{category.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-1">{products.length} items</p>
        </div>
        <ProductGrid products={products} columns={4} />
      </main>

      <Footer />
    </>
  )
}
