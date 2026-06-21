import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { EventForm } from '../_components/event-form'

export default async function NewEventPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/events" className="text-xs text-gray-400 hover:text-black underline">Events</Link>
          <h1 className="text-xl font-semibold mt-1">New Event</h1>
        </div>
        <EventForm />
      </div>
    </div>
  )
}
