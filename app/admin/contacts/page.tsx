import Link from 'next/link'
import { getContactsAdmin, markContactRead } from '@/lib/actions/contact'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AdminContactsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const contacts = await getContactsAdmin()

  async function handleMarkRead(id: string) {
    'use server'
    await markContactRead(id)
    redirect('/admin/contacts')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">Dashboard</Link>
          <h1 className="text-xl font-semibold mt-1">Contact Requests</h1>
        </div>

        <div className="space-y-4">
          {contacts.map((contact) => (
            <div key={contact.id} className={`bg-white border rounded-lg p-5 ${!contact.is_read ? 'border-black' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{contact.name}</p>
                    {!contact.is_read && <span className="inline-block w-2 h-2 bg-black rounded-full" />}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mb-3">
                    {contact.email && <a href={`mailto:${contact.email}`} className="underline">{contact.email}</a>}
                    {contact.phone && <a href={`tel:${contact.phone}`} className="underline">{contact.phone}</a>}
                    <span>{new Date(contact.created_at).toLocaleString('en-GB')}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.message}</p>
                </div>
                {!contact.is_read && (
                  <form action={handleMarkRead.bind(null, contact.id)}>
                    <button type="submit" className="text-xs text-gray-400 hover:text-black underline whitespace-nowrap">Mark read</button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400">No contact requests yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
