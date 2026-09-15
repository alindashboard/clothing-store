import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { getProductAdmin, deleteProduct } from '@/lib/actions/products'
import { getAllCategoriesAdmin } from '@/lib/actions/categories'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { DeleteButton } from './delete-button'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ categoryId?: string; page?: string; search?: string; status?: string }>
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params
  const { categoryId, page, search, status } = await searchParams
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [product, categories] = await Promise.all([getProductAdmin(id), getAllCategoriesAdmin()])
  if (!product) notFound()

  // Reached via a product link that carried the list's page/filters (see
  // AdminProductsPage) — send the owner back to the exact page they came
  // from instead of resetting to page 1.
  const backParams = new URLSearchParams()
  if (categoryId) backParams.set('categoryId', categoryId)
  if (page) backParams.set('page', page)
  if (search) backParams.set('search', search)
  if (status) backParams.set('status', status)
  const backQs = backParams.toString()
  const backHref = `/admin/products${backQs ? `?${backQs}` : ''}`

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href={backHref} className="text-xs text-gray-400 hover:text-black underline">Products</Link>
            <h1 className="text-xl font-semibold mt-1">{product.name}</h1>
          </div>
          <form action={async () => { 'use server'; await deleteProduct(id); redirect(backHref) }}>
            <DeleteButton />
          </form>
        </div>
        <ProductForm product={product} categories={categories} backHref={backHref} />
      </div>
    </div>
  )
}
