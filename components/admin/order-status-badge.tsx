import { cn } from '@/lib/utils'
import type { OrderStatus, PaymentStatus } from '@/lib/types'

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', className: 'bg-indigo-100 text-indigo-800' },
  processing: { label: 'Processing', className: 'bg-purple-100 text-purple-800' },
  shipped: { label: 'Shipped', className: 'bg-cyan-100 text-cyan-800' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-700' },
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  )
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  className?: string
}

const paymentConfig: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: { label: 'Unpaid', className: 'bg-orange-100 text-orange-800' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  refunded: { label: 'Refunded', className: 'bg-gray-100 text-gray-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = paymentConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  )
}
