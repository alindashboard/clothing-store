import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { getProductAdmin } from '@/lib/actions/products'
import { getAllCategoriesAdmin } from '@/lib/actions/categories'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { deleteProduct } from '@/lib/actions/products'

interface Props { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [product, categories] = await Promise.all([getProductAdmin(id), getAllCategoriesAdmin()])
  if (!product) notFound()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/products" className="text-xs text-gray-400 hover:text-black underline">Products</Link>
            <h1 className="text-xl font-semibold mt-1">{product.name}</h1>
          </div>
          <form action={async () => { 'use server'; await deleteProduct(id); redirect('/admin/products') }}>
            <button type="submit" className="text-xs text-red-500 hover:text-red-700 underline" onClick={(e) => { if (!confirm('Delete this product?')) e.preventDefault() }}>
              Delete Product
            </button>
          </form>
        </div>
        <ProductForm product={product} categories={categories} />
      </div>
    </div>
  )
}
