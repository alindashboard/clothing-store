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

  const shoeSlugs = SITE_CONFIG.brand.shoeCategorySlugs

  async function handleCreate(fd: FormData) {
    'use server'
    await createCategory(fd)
    redirect('/admin/categories')
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">Dashboard</Link>
        <h1 className="text-xl font-semibold mt-1">Categories</h1>
      </div>

      {/* The table owns the full width — it has nine columns and its controls
          were previously hidden behind a horizontal scrollbar. */}
      <CategoriesClient
        categories={categories}
        productCounts={productCounts}
        shoeSlugs={shoeSlugs}
        createAction={handleCreate}
      />
    </div>
  )
}
