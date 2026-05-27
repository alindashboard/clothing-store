import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrderAdmin, updateOrderStatus, updateOrderTracking, updateOrderNotes } from '@/lib/actions/orders'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/order-status-badge'

interface Props { params: Promise<{ id: string }> }

const ORDER_STATUSES = ['pending','confirmed','paid','processing','shipped','delivered','cancelled','refunded']

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const order = await getOrderAdmin(id)
  if (!order) notFound()

  async function handleStatusUpdate(fd: FormData) {
    'use server'
    await updateOrderStatus(id, fd.get('status') as string)
    redirect(`/admin/orders/${id}`)
  }

  async function handleTrackingUpdate(fd: FormData) {
    'use server'
    await updateOrderTracking(id, fd.get('tracking_number') as string, fd.get('tracking_url') as string)
    redirect(`/admin/orders/${id}`)
  }

  async function handleNotesUpdate(fd: FormData) {
    'use server'
    await updateOrderNotes(id, fd.get('notes') as string)
    redirect(`/admin/orders/${id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/orders" className="text-xs text-gray-400 hover:text-black underline">Orders</Link>
          <h1 className="text-xl font-semibold mt-1">{order.order_number}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Items</h2>
              <div className="space-y-3">
                {(order.items ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-gray-500">{item.variant_color} / {item.variant_size} x {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{formatPrice(item.total_price)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{order.shipping_cost === 0 ? 'Free' : formatPrice(order.shipping_cost)}</span></div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200"><span>Total</span><span>{formatPrice(order.total)}</span></div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Customer</h2>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-gray-500">{order.customer_email}</p>
                {order.customer_phone && <p className="text-gray-500">{order.customer_phone}</p>}
                <div className="pt-3 mt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Shipping address</p>
                  <p>{order.shipping_address_line1}</p>
                  {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                  <p>{order.shipping_city}, {order.shipping_postal_code}</p>
                  <p>{order.shipping_country}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Tracking</h2>
              <form action={handleTrackingUpdate} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500">Tracking Number</label>
                  <input name="tracking_number" defaultValue={order.tracking_number ?? ''} className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500">Tracking URL</label>
                  <input name="tracking_url" defaultValue={order.tracking_url ?? ''} className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                </div>
                <button type="submit" className="px-4 py-2 bg-black text-white text-xs font-medium hover:bg-gray-800">Save Tracking</button>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Internal Notes</h2>
              <form action={handleNotesUpdate}>
                <textarea name="notes" defaultValue={order.notes ?? ''} rows={3} className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
                <button type="submit" className="mt-2 px-4 py-2 bg-black text-white text-xs font-medium hover:bg-gray-800">Save Notes</button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Status</h2>
              <div className="space-y-3">
                <div><OrderStatusBadge status={order.status} /></div>
                <div><PaymentStatusBadge status={order.payment_status} /></div>
                <p className="text-xs text-gray-400">Payment: {order.payment_method ?? '—'}</p>
              </div>
              <form action={handleStatusUpdate} className="mt-4 space-y-2">
                <select name="status" defaultValue={order.status} className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <button type="submit" className="w-full py-2 bg-black text-white text-xs font-medium hover:bg-gray-800">Update Status</button>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-2">Timeline</h2>
              <p className="text-xs text-gray-400">Created: {new Date(order.created_at).toLocaleString('en-GB')}</p>
              <p className="text-xs text-gray-400">Updated: {new Date(order.updated_at).toLocaleString('en-GB')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
