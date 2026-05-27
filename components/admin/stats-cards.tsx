import { formatPrice } from '@/lib/utils'
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react'

interface StatsCardsProps {
  ordersToday: number
  ordersWeek: number
  revenueToday: number
  revenueWeek: number
  activeProducts: number
  lowStockCount: number
}

export function StatsCards(props: StatsCardsProps) {
  const cards = [
    {
      label: 'Orders Today',
      value: props.ordersToday,
      sub: `${props.ordersWeek} this week`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Revenue Today',
      value: formatPrice(props.revenueToday),
      sub: `${formatPrice(props.revenueWeek)} this week`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Active Products',
      value: props.activeProducts,
      sub: 'currently listed',
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Low Stock Alerts',
      value: props.lowStockCount,
      sub: props.lowStockCount > 0 ? 'variants need restocking' : 'all variants stocked',
      icon: AlertTriangle,
      color: props.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-400',
      bg: props.lowStockCount > 0 ? 'bg-amber-50' : 'bg-gray-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}
