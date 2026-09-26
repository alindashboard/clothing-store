import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOrderAdmin, getOrderStatusHistory, updateOrderTracking, updateOrderNotes, deleteOrder } from '@/lib/actions/orders'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { OrderStatusPanel } from '@/components/admin/order-status-panel'
import { OrderStatusBadge } from '@/components/admin/order-status-badge'
import { DeleteOrderButton } from './delete-order-button'

interface Props { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [order, history] = await Promise.all([
    getOrderAdmin(id),
    getOrderStatusHistory(id),
  ])
  if (!order) notFound()

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
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <Link href="/admin/orders" className="text-xs text-gray-400 hover:text-black underline">Orders</Link>
            <h1 className="text-xl font-semibold mt-1">{order.order_number}</h1>
          </div>
          <form action={async () => { 'use server'; await deleteOrder(id); redirect('/admin/orders') }}>
            <DeleteOrderButton />
          </form>
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
                      {item.sku && <p className="text-xs text-gray-400 font-mono">{item.sku}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.total_price)}</p>
                      {item.list_unit_price != null && (
                        <p className="text-xs text-gray-400">
                          list <span className="line-through">{formatPrice(item.list_unit_price)}</span>
                          {' '}−{Math.round((1 - item.unit_price / item.list_unit_price) * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{order.shipping_cost === 0 ? 'Free' : formatPrice(order.shipping_cost)}</span></div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                <div className="flex justify-between text-xs text-gray-400"><span>of which VAT</span><span>{formatPrice(order.tax_amount)}</span></div>
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
                  <p>{order.shipping_postal_code} {order.shipping_city}{order.shipping_state ? ` (${order.shipping_state})` : ''}</p>
                  <p>{order.shipping_country}</p>
                </div>
                {/* Pre-2026-09-26 orders stored billing as NULL when same as shipping. */}
                {!order.billing_same_as_shipping && order.billing_address_line1 && (
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Billing address</p>
                    <p>{order.billing_address_line1}</p>
                    {order.billing_address_line2 && <p>{order.billing_address_line2}</p>}
                    <p>{order.billing_postal_code} {order.billing_city}{order.billing_state ? ` (${order.billing_state})` : ''}</p>
                    <p>{order.billing_country}</p>
                  </div>
                )}
                {order.billing_same_as_shipping && (
                  <p className="pt-3 mt-3 border-t border-gray-100 text-xs text-gray-400">Billing address same as shipping</p>
                )}
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
            <OrderStatusPanel
              orderId={order.id}
              status={order.status}
              paymentStatus={order.payment_status}
              paymentMethod={order.payment_method}
              paidAt={order.paid_at}
              trackingNumber={order.tracking_number}
              trackingUrl={order.tracking_url}
            />

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Timeline</h2>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Created</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('en-GB')}</p>
                  </div>
                </li>
                {(history.length > 0 && history[0].status === 'pending' ? history.slice(1) : history).map((entry, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div>
                      <OrderStatusBadge status={entry.status as typeof order.status} />
                      <p className="text-xs text-gray-400 mt-1">{new Date(entry.created_at).toLocaleString('en-GB')}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
