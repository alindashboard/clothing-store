import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { getAllProductsAdmin } from '@/lib/actions/products'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

export default async function AdminProductsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const products = await getAllProductsAdmin()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">Dashboard</Link>
            <h1 className="text-xl font-semibold mt-1">Products</h1>
          </div>
          <Link href="/admin/products/new" className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                          <Image src={primaryImg?.url ?? '/images/placeholder-product.svg'} alt={product.name} fill sizes="40px" className="object-cover" unoptimized />
                        </div>
                        <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">{product.name}</Link>
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
                      <Link href={`/admin/products/${product.id}`} className="text-xs text-gray-400 hover:text-black underline">Edit</Link>
                    </td>
                  </tr>
                )
              })}
              {products.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
