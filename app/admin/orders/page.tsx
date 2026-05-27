import Link from 'next/link'
import { getOrdersAdmin } from '@/lib/actions/orders'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/order-status-badge'

interface Props { searchParams: Promise<{ status?: string; search?: string }> }

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status, search } = await searchParams
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const orders = await getOrdersAdmin({ status, search })

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">Dashboard</Link>
            <h1 className="text-xl font-semibold mt-1">Orders</h1>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Order', 'Customer', 'Date', 'Total', 'Status', 'Payment', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3"><PaymentStatusBadge status={order.payment_status} /></td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/orders/${order.id}`} className="text-xs text-gray-400 hover:text-black underline">View</Link></td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm">{order.order_number}</p>
                <p className="text-xs text-gray-600 mt-0.5">{order.customer_name}</p>
                <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-GB')}</p>
              </div>
              <div className="shrink-0 text-right space-y-1.5">
                <p className="font-semibold text-sm">{formatPrice(order.total)}</p>
                <OrderStatusBadge status={order.status} />
              </div>
            </Link>
          ))}
          {orders.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400">No orders found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
