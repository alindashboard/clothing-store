import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getAllEventsAdmin } from '@/lib/actions/events'
import { EventsAdminList } from './_components/events-admin-list'
import { Suspense } from 'react'

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { filter } = await searchParams
  const validFilter = (['upcoming', 'past', 'drafts'] as const).find((f) => f === filter)
  const events = await getAllEventsAdmin(validFilter)

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Events</h1>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Event
        </Link>
      </div>

      <Suspense>
        <EventsAdminList events={events} activeFilter={filter ?? 'all'} />
      </Suspense>
    </div>
  )
}
