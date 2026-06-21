import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getEventAdmin } from '@/lib/actions/events'
import { EventForm } from '../../_components/event-form'

interface Props { params: Promise<{ id: string }> }

export default async function EditEventPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const event = await getEventAdmin(id)
  if (!event) notFound()

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/events" className="text-xs text-gray-400 hover:text-black underline">Events</Link>
          <h1 className="text-xl font-semibold mt-1">{event.title}</h1>
        </div>
        <EventForm event={event} />
      </div>
    </div>
  )
}
