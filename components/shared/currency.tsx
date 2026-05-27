import { formatPrice } from '@/lib/utils'

interface PriceProps {
  amount: number
  currency?: string
  className?: string
}

export function Price({ amount, currency = 'EUR', className }: PriceProps) {
  return <span className={className}>{formatPrice(amount, currency)}</span>
}
