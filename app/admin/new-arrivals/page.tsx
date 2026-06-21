import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getNewArrivals } from '@/lib/actions/new-arrivals'
import { NewArrivalsAdmin } from './new-arrivals-admin'

export const dynamic = 'force-dynamic'

export default async function AdminNewArrivalsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const items = await getNewArrivals()

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">
            Dashboard
          </Link>
          <h1 className="text-xl font-semibold mt-1">New Arrivals — Curated List</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the products featured in the New Arrivals section. Up to ~8 products recommended.
          </p>
        </div>

        <NewArrivalsAdmin initialItems={items} />
      </div>
    </div>
  )
}
