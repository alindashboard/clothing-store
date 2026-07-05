'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface ProductBadgeProps {
  type: 'new' | 'sale' | 'out-of-stock'
  /** 'dark' = for use on dark surfaces (e.g. homepage dark sections, product page). */
  variant?: 'light' | 'dark'
}

const lightStyles = {
  new: 'bg-black text-white',
  sale: 'bg-red-600 text-white',
  'out-of-stock': 'bg-gray-400 text-white',
}

const darkStyles = {
  new: 'bg-[#D9B679] text-[#141412]',
  sale: 'bg-[#b8433a] text-[#EDE9E1]',
  'out-of-stock': 'bg-[#2B2924] text-[#8C8577]',
}

export function ProductBadge({ type, variant = 'light' }: ProductBadgeProps) {
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
        variant === 'dark' ? darkStyles[type] : lightStyles[type]
      )}
      style={variant === 'dark' ? { fontFamily: 'var(--font-grotesk, var(--font-sans))' } : undefined}
    >
      {labels[type]}
    </span>
  )
}
