import Link from 'next/link'
import { getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory } from '@/lib/actions/categories'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AdminCategoriesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const categories = await getAllCategoriesAdmin()

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">Dashboard</Link>
          <h1 className="text-xl font-semibold mt-1">Categories</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <button type="submit" className="w-full py-2 bg-black text-white text-sm font-medium hover:bg-gray-800">Add Category</button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Slug', 'Order', 'Active', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{cat.name}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{cat.slug}</td>
                    <td className="px-4 py-2.5 text-gray-500">{cat.sort_order}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs ${cat.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {cat.is_active ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <form action={handleDelete.bind(null, cat.id)}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No categories.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
