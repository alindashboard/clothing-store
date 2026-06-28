'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface ProductBadgeProps {
  type: 'new' | 'sale' | 'out-of-stock'
}

const styles = {
  new: 'bg-black text-white',
  sale: 'bg-red-600 text-white',
  'out-of-stock': 'bg-gray-400 text-white',
}

export function ProductBadge({ type }: ProductBadgeProps) {
  const t = useTranslations('product')
  const labels = {
    new: t('badgeNew'),
    sale: t('badgeSale'),
    'out-of-stock': t('badgeOutOfStock'),
  }

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
