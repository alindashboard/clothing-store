import { createSupabaseServerClient } from '@/lib/supabase-server'
import { AdminShell } from '@/components/admin/admin-shell'
import { SITE_CONFIG } from '@/lib/config'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <>{children}</>

  return (
    <AdminShell brandName={SITE_CONFIG.brand.name}>
      {children}
    </AdminShell>
  )
}
