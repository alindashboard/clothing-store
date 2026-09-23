import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Throws unless the request carries a logged-in Supabase session.
 *
 * Every export of a 'use server' module is a public POST endpoint — the proxy's
 * /admin redirect only protects page navigations, not direct action calls — and
 * the admin actions use the service-role client, which bypasses RLS. So each
 * admin-only action must call this first. Auth is admin-only on this project
 * (no public sign-up), so "logged in" means "admin".
 */
export async function requireAdmin(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authorised')
}
