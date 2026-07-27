import Link from 'next/link'
import { getAllCategoriesAdmin, createCategory } from '@/lib/actions/categories'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { SITE_CONFIG } from '@/lib/config'
import { CategoriesClient } from './categories-client'

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const categories = await getAllCategoriesAdmin()

  const adminClient = createSupabaseAdminClient()
  const { data: countRows } = await adminClient
    .from('products')
    .select('category_id')
    .eq('is_active', true)

  const productCounts: Record<string, number> = {}
  for (const row of countRows ?? []) {
    if (row.category_id) productCounts[row.category_id] = (productCounts[row.category_id] ?? 0) + 1
  }

  const landingSlugs = SITE_CONFIG.brand.landingCategorySlugs
  const shoeSlugs    = SITE_CONFIG.brand.shoeCategorySlugs

  async function handleCreate(fd: FormData) {
    'use server'
    await createCategory(fd)
    redirect('/admin/categories')
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">Dashboard</Link>
          <h1 className="text-xl font-semibold mt-1">Categories</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">

          {/* ── Add form ── */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Add Category</h2>
            <form action={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Name *</label>
                <input name="name" required className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Slug (auto-generated if empty)</label>
                <input name="slug" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Description</label>
                <input name="description" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <button type="submit" className="w-full py-2 bg-black text-white text-sm font-medium hover:bg-gray-800">
                Add Category
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                Added at the end of the list — reorder with the arrows in the table.
              </p>
            </form>

            {/* Config info */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Shown on landing</p>
                <div className="flex flex-wrap gap-1.5">
                  {landingSlugs.map((s) => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Edit in <code className="bg-gray-100 px-1">lib/config.ts → brand.landingCategorySlugs</code></p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Shoe size categories (37–45)</p>
                <div className="flex flex-wrap gap-1.5">
                  {shoeSlugs.map((s) => (
                    <span key={s} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Edit in <code className="bg-gray-100 px-1">lib/config.ts → brand.shoeCategorySlugs</code></p>
              </div>
            </div>
          </div>

          {/* ── Table (client — handles edit/delete modals) ── */}
          <CategoriesClient
            categories={categories}
            productCounts={productCounts}
            landingSlugs={landingSlugs}
            shoeSlugs={shoeSlugs}
          />
        </div>
      </div>
    </div>
  )
}
