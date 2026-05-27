import Link from 'next/link'
import { ProductForm } from '@/components/admin/product-form'
import { getAllCategoriesAdmin } from '@/lib/actions/categories'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function NewProductPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const categories = await getAllCategoriesAdmin()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/products" className="text-xs text-gray-400 hover:text-black underline">Products</Link>
          <h1 className="text-xl font-semibold mt-1">New Product</h1>
        </div>
        <ProductForm categories={categories} />
      </div>
    </div>
  )
}
