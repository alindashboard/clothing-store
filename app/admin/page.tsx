import Link from 'next/link'
import { Package, ShoppingCart, Tag, MessageSquare } from 'lucide-react'
import { StatsCards } from '@/components/admin/stats-cards'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { getDashboardStats, getOrdersAdmin } from '@/lib/actions/orders'
import { formatPrice } from '@/lib/utils'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { SITE_CONFIG } from '@/lib/config'

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getOrdersAdmin({ limit: 10 }),
  ])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase">{SITE_CONFIG.brand.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { href: '/admin', label: 'Dashboard', icon: Package },
            { href: '/admin/products', label: 'Products', icon: Package },
            { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
            { href: '/admin/categories', label: 'Categories', icon: Tag },
            { href: '/admin/contacts', label: 'Contacts', icon: MessageSquare },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded transition-colors">
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600">
            View Store
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <h1 className="text-xl font-semibold mb-6">Dashboard</h1>
        <StatsCards {...stats} />

        {stats.lowStockItems.length > 0 && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-amber-800 mb-3">Low Stock Alerts</h2>
            <div className="space-y-2">
              {stats.lowStockItems.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-amber-700">{(item.products as any)?.name} - {item.color_name} / {item.size}</span>
                  <span className="font-semibold text-amber-800">{item.stock_quantity} left</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-gray-400 hover:text-black underline">View all</Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order', 'Customer', 'Date', 'Total', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">{order.order_number}</Link></td>
                    <td className="px-4 py-3 text-gray-600">{order.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
