import { useTranslations } from 'next-intl'
import { ShieldCheck, Store, RotateCcw, Lock } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { SITE_CONFIG } from '@/lib/config'
import { PaymentLogos } from './payment-logos'

interface TrustBadgesProps {
  variant?: 'light' | 'dark'
  // 1 for narrow containers (the PDP side column), where a viewport-based
  // 2-column grid would squeeze each item.
  columns?: 1 | 2
  className?: string
}

// Authenticity / store / returns / payment reassurance, shown on the PDP (dark)
// and under the checkout submit button (light). Returns wording must stay in
// line with the Returns section of /terms (14 days from delivery).
export function TrustBadges({ variant = 'light', columns = 2, className = '' }: TrustBadgesProps) {
  const t = useTranslations('trust')
  const dark = variant === 'dark'
  const twoCol = columns === 2

  const accent = dark ? SITE_CONFIG.brand.darkAccent : SITE_CONFIG.brand.accent
  const titleColor = dark ? '#EDE9E1' : '#111111'
  const bodyColor = dark ? '#a9a598' : '#6b7280'
  const borderColor = dark ? '#2B2924' : '#e5e7eb'

  const items = [
    { icon: ShieldCheck, title: t('authenticTitle'), body: t('authenticBody') },
    { icon: Store, title: t('storeTitle'), body: t('storeBody'), href: '/store' as const },
    { icon: RotateCcw, title: t('returnsTitle'), body: t('returnsBody') },
    { icon: Lock, title: t('paymentTitle'), body: t('paymentBody'), logos: true },
  ]

  return (
    <div className={`border ${className}`} style={{ borderColor }}>
      <ul className={`grid grid-cols-1 ${twoCol ? 'sm:grid-cols-2' : ''}`}>
        {items.map(({ icon: Icon, title, body, href, logos }, i) => (
          <li
            key={title}
            className={`flex gap-3 p-4 ${i > 0 ? 'border-t' : ''} ${twoCol && i === 1 ? 'sm:border-t-0' : ''} ${twoCol && i % 2 === 1 ? 'sm:border-l' : ''}`}
            style={{ borderColor }}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold mb-1" style={{ color: titleColor }}>
                {href ? (
                  <Link href={href} prefetch={false} className="underline-offset-4 hover:underline">
                    {title}
                  </Link>
                ) : (
                  title
                )}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: bodyColor }}>{body}</p>
              {logos && <PaymentLogos variant={variant} className="mt-2.5" />}
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t px-4 py-3" style={{ borderColor }}>
        <Link
          href={{ pathname: '/', hash: 'chi-siamo' }}
          prefetch={false}
          className="text-[11px] font-medium tracking-[0.15em] uppercase transition-opacity hover:opacity-80"
          style={{ color: accent }}
        >
          {t('aboutLink')}
        </Link>
      </div>
    </div>
  )
}
