'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateOrderStatus } from '@/lib/actions/orders'
import { OrderStatusBadge, PaymentStatusBadge } from './order-status-badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import type { OrderStatus, PaymentStatus } from '@/lib/types'

const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
]

interface OrderStatusPanelProps {
  orderId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string | null
  paidAt: string | null
  trackingNumber: string | null
  trackingUrl: string | null
}

export function OrderStatusPanel({
  orderId,
  status,
  paymentStatus,
  paymentMethod,
  paidAt,
  trackingNumber,
  trackingUrl,
}: OrderStatusPanelProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<OrderStatus>(status)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function applyUpdate() {
    setLoading(true)
    const result = await updateOrderStatus(orderId, selected)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('Order status updated')
    router.refresh()
  }

  function handleUpdateClick() {
    const missingTracking = selected === 'shipped' && (!trackingNumber?.trim() || !trackingUrl?.trim())
    if (missingTracking) {
      setConfirmOpen(true)
      return
    }
    applyUpdate()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Status</h2>
      <div className="space-y-3">
        <div><OrderStatusBadge status={status} /></div>
        <div><PaymentStatusBadge status={paymentStatus} /></div>
        <p className="text-xs text-gray-400">Payment: {paymentMethod ?? '—'}</p>
        {paidAt && <p className="text-xs text-gray-400">Paid: {new Date(paidAt).toLocaleString('en-GB')}</p>}
        {paymentMethod !== 'stripe' && paymentStatus === 'unpaid' && (
          <p className="text-xs text-gray-500">Set status to <strong>Paid</strong> once the payment has arrived.</p>
        )}
      </div>
      <div className="mt-4 space-y-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value as OrderStatus)}
          disabled={loading}
          className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleUpdateClick}
          disabled={loading || selected === status}
          className="w-full py-2 bg-black text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {loading ? 'Updating…' : 'Update Status'}
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No tracking info saved</DialogTitle>
            <DialogDescription>
              This order has no tracking number or tracking URL saved. The shipping
              confirmation email will go out without a tracking link. Mark it as
              shipped anyway, or cancel and save tracking info first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="px-4 py-2 border border-gray-300 text-sm font-medium hover:border-gray-500">
              Cancel
            </DialogClose>
            <button
              type="button"
              onClick={() => { setConfirmOpen(false); applyUpdate() }}
              className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800"
            >
              Mark as Shipped
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
