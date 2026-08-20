import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductGridInfinite } from '@/components/product/product-grid-infinite'
import { getProductsPage } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { SITE_CONFIG } from '@/lib/config'
import { getAlternates } from '@/lib/seo/alternates'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: cat } = await supabase.from('categories').select('name').eq('slug', slug).single()
  return {
    title: cat ? cat.name : SITE_CONFIG.brand.name,
    alternates: getAlternates(locale, `/category/${slug}`),
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()
  const { data: category } = await supabase.from('categories').select('*').eq('slug', slug).single()

  if (!category) notFound()

  const [categories, { products, hasMore }, t] = await Promise.all([
    getCategories(),
    getProductsPage({ categorySlug: slug }),
    getTranslations('product'),
  ])

  // On a parent, its children; on a child, the categories next to it.
  const parentSlug = category.parent_id
    ? categories.find((c) => c.id === category.parent_id)?.slug ?? slug
    : slug
  const siblings = categories.filter(
    (c) => c.parent_id === (category.parent_id ?? category.id)
  )

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
          <span style={{ color: '#c7c3b8' }}>{category.name}</span>
        </div>

        {/* Category header */}
        <div className="max-w-7xl mx-auto px-4 pt-7 pb-9 md:pb-11 mb-9 md:mb-11 border-b" style={{ borderColor: '#2B2924' }}>
          <p
            className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-2.5 md:mb-3.5"
            style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {t('categoryEyebrow')}
          </p>
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 md:gap-6">
            <h1
              className="font-black uppercase leading-none text-[#EDE9E1]"
              style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: 'clamp(34px, 4.5vw, 56px)', letterSpacing: '-0.02em' }}
            >
              {category.name}
            </h1>
            <p
              className="text-xs tracking-wide whitespace-nowrap"
              style={{ color: '#8C8577', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {products.length}{hasMore ? '+' : ''} {t('items')}
            </p>
          </div>
          {category.description && (
            <p className="text-sm leading-relaxed mt-3 md:mt-[18px] max-w-[620px]" style={{ color: '#a9a598' }}>
              {category.description}
            </p>
          )}

          {/* Drill-down row: a parent lists its children, a child lists its
              siblings so you can move sideways without going back up. */}
          {siblings.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 md:mt-7">
              <Link
                href={`/category/${parentSlug}`}
                prefetch={false}
                className="text-xs tracking-widest uppercase pb-0.5 border-b"
                style={{
                  color: parentSlug === slug ? SITE_CONFIG.brand.darkAccent : '#8C8577',
                  borderColor: parentSlug === slug ? SITE_CONFIG.brand.darkAccent : 'transparent',
                  fontFamily: 'var(--font-grotesk, var(--font-sans))',
                }}
              >
                {t('filterAll')}
              </Link>
              {siblings.map((sib) => (
                <Link
                  key={sib.id}
                  href={`/category/${sib.slug}`}
                  prefetch={false}
                  className="text-xs tracking-widest uppercase pb-0.5 border-b transition-colors hover:text-[#c7c3b8]"
                  style={{
                    color: sib.slug === slug ? SITE_CONFIG.brand.darkAccent : '#8C8577',
                    borderColor: sib.slug === slug ? SITE_CONFIG.brand.darkAccent : 'transparent',
                    fontFamily: 'var(--font-grotesk, var(--font-sans))',
                  }}
                >
                  {sib.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-16">
          <ProductGridInfinite
            initialProducts={products}
            initialHasMore={hasMore}
            categorySlug={slug}
            columns={4}
            variant="dark"
          />
        </div>
      </main>

      <Footer />
    </>
  )
}
