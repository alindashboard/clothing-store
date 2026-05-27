import { cn } from '@/lib/utils'

interface ProductBadgeProps {
  type: 'new' | 'sale' | 'out-of-stock'
}

const styles = {
  new: 'bg-black text-white',
  sale: 'bg-red-600 text-white',
  'out-of-stock': 'bg-gray-400 text-white',
}

const labels = {
  new: 'NEW',
  sale: 'SALE',
  'out-of-stock': 'OUT OF STOCK',
}

export function ProductBadge({ type }: ProductBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase',
        styles[type]
      )}
    >
      {labels[type]}
    </span>
  )
}
