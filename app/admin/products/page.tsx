import Link from 'next/link'
import Image from 'next/image'
import { Plus, Download } from 'lucide-react'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAllProductsAdmin } from '@/lib/actions/products'
import { getAllCategoriesAdmin } from '@/lib/actions/categories'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { formatPrice } from '@/lib/utils'
import { ProductFilterBar } from '@/components/admin/product-filter-bar'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { HideImagelessToggle } from '@/components/admin/hide-imageless-toggle'
import { BulkDescriptionGenerator } from '@/components/admin/bulk-description-generator'
import { hideProductsWithoutImages } from '@/lib/site-settings'

const PAGE_SIZE = 50

// Server Actions on this page include AI description generation (a vision call per product).
export const maxDuration = 60

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoryId?: string
    page?: string
    search?: string
    status?: string
  }>
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { categoryId, page: pageParam, search, status } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const [{ products, totalCount }, categories, hideImageless] = await Promise.all([
    getAllProductsAdmin({
      categoryId,
      page,
      pageSize: PAGE_SIZE,
      search,
      status: (status as 'active' | 'draft' | 'incomplete' | 'all') || 'all',
    }),
    getAllCategoriesAdmin(),
    hideProductsWithoutImages(),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Carried on every product link so saving/discarding an edit returns here
  // instead of resetting to page 1 (see CLAUDE.md admin gotchas).
  const returnParams = new URLSearchParams()
  if (categoryId) returnParams.set('categoryId', categoryId)
  if (page > 1) returnParams.set('page', String(page))
  if (search) returnParams.set('search', search)
  if (status) returnParams.set('status', status)
  const returnQs = returnParams.toString()
  const editHref = (id: string) => `/admin/products/${id}${returnQs ? `?${returnQs}` : ''}`

  // Export carries the same category/status/search filters as the current view
  // (not pagination — export is always the full filtered set, not just this page).
  const exportParams = new URLSearchParams()
  if (categoryId) exportParams.set('categoryId', categoryId)
  if (search) exportParams.set('search', search)
  if (status) exportParams.set('status', status)
  const exportQs = exportParams.toString()
  const exportHref = `/api/admin/export-stock${exportQs ? `?${exportQs}` : ''}`
  const exportByBrandHref = `/api/admin/export-stock-by-brand${exportQs ? `?${exportQs}` : ''}`

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Products</h1>
        <div className="flex items-center gap-2">
          <a
            href={exportHref}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium hover:border-gray-400 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
          <a
            href={exportByBrandHref}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm font-medium hover:border-gray-400 transition-colors"
          >
            <Download className="w-4 h-4" /> Export by Brand (XLSX)
          </a>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      <HideImagelessToggle initial={hideImageless} />
      <BulkDescriptionGenerator />

      <Suspense>
        <ProductFilterBar
          categories={categories}
          activeCategoryId={categoryId ?? ''}
          totalCount={totalCount}
        />
      </Suspense>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Product', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product) => {
              const primaryImg = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
              const totalStock = (product.variants ?? []).reduce((s, v) => s + v.stock_quantity, 0)
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-12 bg-gray-100 shrink-0">
                        <Image
                          src={primaryImg?.url ?? '/images/placeholder-product.svg'}
                          alt={product.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized={primaryImg?.url?.startsWith('/') ?? true}
                        />
                      </div>
                      <Link href={editHref(product.id)} className="font-medium hover:underline">{product.name}</Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{(product.category as any)?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(product.base_price)}</td>
                  <td className="px-4 py-3 text-gray-600">{totalStock} units</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                      {product.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={editHref(product.id)} className="text-xs text-gray-400 hover:text-black underline">Edit</Link>
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No products found.</td></tr>
            )}
          </tbody>
        </table>
        <Suspense>
          <AdminPagination page={page} totalPages={totalPages} />
        </Suspense>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {products.map((product) => {
          const primaryImg = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
          const totalStock = (product.variants ?? []).reduce((s, v) => s + v.stock_quantity, 0)
          return (
            <Link
              key={product.id}
              href={editHref(product.id)}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-400 transition-colors"
            >
              <div className="relative w-12 h-16 bg-gray-100 shrink-0 rounded overflow-hidden">
                <Image
                  src={primaryImg?.url ?? '/images/placeholder-product.svg'}
                  alt={product.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized={primaryImg?.url?.startsWith('/') ?? true}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(product.category as any)?.name ?? 'No category'}</p>
                <p className="text-sm font-semibold mt-1">{formatPrice(product.base_price)}</p>
              </div>
              <div className="shrink-0 text-right space-y-1.5">
                <span className={`block text-center px-2 py-0.5 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {product.is_active ? 'Active' : 'Draft'}
                </span>
                <p className="text-xs text-gray-400">{totalStock} units</p>
              </div>
            </Link>
          )
        })}
        {products.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400">No products found.</div>
        )}
        <Suspense>
          <AdminPagination page={page} totalPages={totalPages} />
        </Suspense>
      </div>
    </div>
  )
}
