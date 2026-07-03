import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { SITE_CONFIG } from '@/lib/config'

interface PriceDisplayProps {
  price: number
  compareAtPrice?: number | null
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  /** 'dark' = for use on dark surfaces (e.g. homepage dark sections) — cream/gold instead of near-black/gray text. */
  variant?: 'light' | 'dark'
}

export function PriceDisplay({
  price,
  compareAtPrice,
  currency = 'EUR',
  size = 'md',
  variant = 'light',
}: PriceDisplayProps) {
  const sizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[size]

  if (compareAtPrice && compareAtPrice > price) {
    return (
      <div className="flex items-baseline gap-2">
        <span className={cn('font-semibold', variant === 'dark' ? 'text-[#b8433a]' : 'text-red-600', sizeClass)}>
          {formatPrice(price, currency)}
        </span>
        <span className={cn(variant === 'dark' ? 'text-[#6b6862]' : 'text-gray-400', 'line-through', size === 'lg' ? 'text-base' : 'text-sm')}>
          {formatPrice(compareAtPrice, currency)}
        </span>
      </div>
    )
  }

  return (
    <span
      className={cn('font-semibold', variant === 'light' && 'text-gray-900', sizeClass)}
      style={variant === 'dark' ? { color: SITE_CONFIG.brand.darkAccent } : undefined}
    >
      {formatPrice(price, currency)}
    </span>
  )
}
