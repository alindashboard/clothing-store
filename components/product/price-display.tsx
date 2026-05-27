import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  price: number
  compareAtPrice?: number | null
  currency?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PriceDisplay({
  price,
  compareAtPrice,
  currency = 'EUR',
  size = 'md',
}: PriceDisplayProps) {
  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[size]

  if (compareAtPrice && compareAtPrice > price) {
    return (
      <div className="flex items-baseline gap-2">
        <span className={cn('font-semibold text-red-600', sizeClass)}>
          {formatPrice(price, currency)}
        </span>
        <span className={cn('text-gray-400 line-through', size === 'lg' ? 'text-base' : 'text-sm')}>
          {formatPrice(compareAtPrice, currency)}
        </span>
      </div>
    )
  }

  return (
    <span className={cn('font-semibold text-gray-900', sizeClass)}>
      {formatPrice(price, currency)}
    </span>
  )
}
