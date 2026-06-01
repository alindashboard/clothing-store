import Link from 'next/link'
import { getAllCategoriesAdmin, createCategory, deleteCategory } from '@/lib/actions/categories'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { SITE_CONFIG } from '@/lib/config'

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const categories = await getAllCategoriesAdmin()

  // Product counts per category
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

  async function handleDelete(id: string) {
    'use server'
    await deleteCategory(id)
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
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Sort Order</label>
                <input name="sort_order" type="number" defaultValue="0" className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
              </div>
              <button type="submit" className="w-full py-2 bg-black text-white text-sm font-medium hover:bg-gray-800">
                Add Category
              </button>
            </form>

            {/* Config info */}
            <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Shown on landing</p>
                <div className="flex flex-wrap gap-1.5">
                  {landingSlugs.map(s => (
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
                  {shoeSlugs.map(s => (
                    <span key={s} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Edit in <code className="bg-gray-100 px-1">lib/config.ts → brand.shoeCategorySlugs</code></p>
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto min-w-0">
            <table className="w-full text-sm min-w-[380px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Products</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Flags</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Active</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((cat) => {
                  const count   = productCounts[cat.id] ?? 0
                  const onLand  = landingSlugs.includes(cat.slug)
                  const isShoe  = shoeSlugs.includes(cat.slug)
                  return (
                    <tr key={cat.id} className={`hover:bg-gray-50 ${!cat.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2.5 font-medium">{cat.name}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs font-mono">{cat.slug}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold ${count > 0 ? 'text-green-700' : 'text-gray-300'}`}>
                          {count}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {onLand && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                              landing
                            </span>
                          )}
                          {isShoe && (
                            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                              shoe sizes
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs ${cat.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          {cat.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <form action={handleDelete.bind(null, cat.id)}>
                          <button
                            type="submit"
                            className="text-xs text-red-400 hover:text-red-600"
                            disabled={count > 0}
                            title={count > 0 ? `Cannot delete — ${count} product(s) assigned` : 'Delete'}
                          >
                            {count > 0 ? '—' : 'Delete'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
                {categories.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No categories.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
