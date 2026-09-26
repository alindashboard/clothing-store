import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getRecentStoreSales } from '@/lib/actions/store-sales'
import { StoreSalePanel } from '@/components/admin/store-sale-panel'

export default async function AdminStoreSalesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const recentSales = await getRecentStoreSales()

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">Dashboard</Link>
          <h1 className="text-xl font-semibold mt-1">In-store sales</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sold something in the shop? Find it and tap the size — the website stock goes down by one,
            so the piece can&apos;t be sold online as well.
          </p>
        </div>
        <StoreSalePanel recentSales={recentSales} />
      </div>
    </div>
  )
}
