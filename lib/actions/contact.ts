'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { sendContactNotification } from '@/lib/email/send'
import { requireAdmin } from '@/lib/auth/require-admin'

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

  // Don't block the success response on email delivery.
  await Promise.allSettled([
    sendContactNotification({ name, email, phone, message }),
  ])

  return { success: true }
}

export async function getContactsAdmin() {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('contact_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function markContactRead(id: string) {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('contact_requests')
    .update({ is_read: true })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/contacts')
  return { success: true }
}
