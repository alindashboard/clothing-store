'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import type { Event } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'

export async function getPublishedEvents(): Promise<{ upcoming: Event[]; past: Event[] }> {
  const supabase = createSupabaseAdminClient()
  const now = new Date().toISOString()

  const [upcomingRes, pastRes] = await Promise.all([
    supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('event_date', now)
      .order('event_date', { ascending: true }),
    supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .lt('event_date', now)
      .order('event_date', { ascending: false }),
  ])

  return {
    upcoming: upcomingRes.data ?? [],
    past: pastRes.data ?? [],
  }
}

export async function getAllEventsAdmin(filter?: 'upcoming' | 'past' | 'drafts'): Promise<Event[]> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const now = new Date().toISOString()
  let query = supabase.from('events').select('*')

  if (filter === 'upcoming') {
    query = query.gte('event_date', now).neq('status', 'draft')
  } else if (filter === 'past') {
    query = query.lt('event_date', now).neq('status', 'draft')
  } else if (filter === 'drafts') {
    query = query.eq('status', 'draft')
  }

  query = query.order('event_date', { ascending: false })

  const { data, error } = await query
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function getEventAdmin(id: string): Promise<Event | null> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export interface EventPayload {
  title: string
  slug: string
  description?: string
  event_date: string
  location?: string
  is_online: boolean
  image_url?: string
  cta_label?: string
  cta_url?: string
  status: 'draft' | 'published'
}

export async function createEvent(payload: EventPayload): Promise<{ id?: string; error?: string }> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/events')
  revalidatePath('/admin/events')
  return { id: data.id }
}

export async function updateEvent(
  id: string,
  payload: Partial<EventPayload>
): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('events').update(payload).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/events')
  revalidatePath('/admin/events')
  return {}
}

export async function deleteEvent(id: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/events')
  revalidatePath('/admin/events')
  return {}
}

export async function toggleEventStatus(
  id: string,
  current: 'draft' | 'published'
): Promise<{ error?: string }> {
  await requireAdmin()
  return updateEvent(id, { status: current === 'published' ? 'draft' : 'published' })
}
