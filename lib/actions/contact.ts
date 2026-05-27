'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function submitContact(formData: FormData) {
  const supabase = createSupabaseAdminClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const message = formData.get('message') as string

  if (!name || !message) return { error: 'Name and message are required.' }

  const { error } = await supabase.from('contact_requests').insert({
    name,
    email: email || null,
    phone: phone || null,
    message,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getContactsAdmin() {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function markContactRead(id: string) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('contact_requests')
    .update({ is_read: true })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/contacts')
  return { success: true }
}
