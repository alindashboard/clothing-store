'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Pencil, Trash2, Globe, MapPin } from 'lucide-react'
import type { Event } from '@/lib/types'
import { deleteEvent, toggleEventStatus } from '@/lib/actions/events'
import { toast } from 'sonner'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'drafts', label: 'Drafts' },
] as const

interface Props {
  events: Event[]
  activeFilter: string
}

export function EventsAdminList({ events: initial, activeFilter }: Props) {
  const [events, setEvents] = useState<Event[]>(initial)

  useEffect(() => { setEvents(initial) }, [initial])

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'all') params.delete('filter')
    else params.set('filter', key)
    router.push(`${pathname}?${params.toString()}`)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await deleteEvent(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== id))
      toast.success('Event deleted')
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  async function handleToggleStatus(event: Event) {
    setTogglingId(event.id)
    const res = await toggleEventStatus(event.id, event.status)
    if (res.error) {
      toast.error(res.error)
    } else {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? { ...e, status: e.status === 'published' ? 'draft' : 'published' }
            : e
        )
      )
      toast.success(event.status === 'published' ? 'Unpublished' : 'Published')
    }
    setTogglingId(null)
  }

  const now = new Date()

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-xs font-medium tracking-wider uppercase transition-colors border-b-2 -mb-px ${
              (activeFilter === key) || (key === 'all' && !['upcoming', 'past', 'drafts'].includes(activeFilter))
                ? 'border-black text-black'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {events.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No events found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events.map((event) => {
                const isPast = new Date(event.event_date) < now
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {event.title}
                      </Link>
                      {isPast && event.status === 'published' && (
                        <span className="text-[10px] text-gray-400 ml-1">(past)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell whitespace-nowrap">
                      {format(new Date(event.event_date), 'MMM d, yyyy · HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {event.is_online ? (
                        <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Online</span>
                      ) : (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          event.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {event.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleToggleStatus(event)}
                          disabled={togglingId === event.id}
                          className="text-xs text-gray-400 hover:text-black transition-colors disabled:opacity-40 whitespace-nowrap"
                        >
                          {togglingId === event.id
                            ? '…'
                            : event.status === 'published'
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="text-gray-400 hover:text-black transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        {confirmDeleteId === event.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDelete(event.id)}
                              disabled={deletingId === event.id}
                              className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-40"
                            >
                              {deletingId === event.id ? '…' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-gray-400 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(event.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
