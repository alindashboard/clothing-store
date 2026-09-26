import { useTranslations } from 'next-intl'
import { ShieldCheck, RotateCcw, Lock, Truck } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/config'
import { formatPrice } from '@/lib/utils'
import { PaymentLogos } from './payment-logos'

/**
 * Homepage reassurance strip (authenticity / returns / payment / shipping) —
 * the landing-page counterpart of TrustBadges, same owner-confirmed wording.
 * Sits between Featured products and About: after browsing, before the story.
 * Returns wording must stay in line with /terms (14 days from delivery).
 */
export function ServiceStrip() {
  const t = useTranslations('trust')
  const gold = SITE_CONFIG.brand.darkAccent

  const items = [
    { icon: ShieldCheck, title: t('authenticTitle'), body: t('stripAuthentic') },
    { icon: RotateCcw, title: t('returnsTitle'), body: t('stripReturns') },
    { icon: Truck, title: t('stripShippingTitle'), body: t('stripShipping', { amount: formatPrice(SITE_CONFIG.shipping.freeShippingThreshold) }) },
    { icon: Lock, title: t('paymentTitle'), logos: true },
  ]

  return (
    <section className="max-w-7xl mx-auto px-4 pb-16 md:pb-20" aria-labelledby="service-strip-heading">
      <p
        id="service-strip-heading"
        className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-6"
        style={{ color: gold, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
      >
        {t('stripHeading')}
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[#2B2924]">
        {items.map(({ icon: Icon, title, body, logos }) => (
          <li key={title} className="flex gap-3.5 py-6 lg:pr-6 border-b border-[#2B2924] lg:border-b-0">
            <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: gold }} strokeWidth={1.5} aria-hidden="true" />
            <div className="min-w-0">
              <p
                className="text-xs font-semibold tracking-[0.18em] uppercase text-[#EDE9E1] mb-1.5"
                style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {title}
              </p>
              {body && <p className="text-[13px] leading-relaxed text-[#8C8577]">{body}</p>}
              {logos && <PaymentLogos variant="dark" className="mt-1" />}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
