import Link from 'next/link'
import { StatsCards } from '@/components/admin/stats-cards'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { getDashboardStats, getOrdersAdmin } from '@/lib/actions/orders'
import { formatPrice } from '@/lib/utils'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getOrdersAdmin({ limit: 10 }),
  ])

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>
      <StatsCards {...stats} />

      {stats.lowStockItems.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-amber-800 mb-3">Low Stock Alerts</h2>
          <div className="space-y-2">
            {stats.lowStockItems.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-700">{(item.products as any)?.name} — {item.color_name} / {item.size}</span>
                <span className="font-semibold text-amber-800">{item.stock_quantity} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-gray-400 hover:text-black underline">View all</Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Order', 'Customer', 'Date', 'Total', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">{order.order_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{order.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatPrice(order.total)}</td>
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
      </div>
    </div>
  )
}
