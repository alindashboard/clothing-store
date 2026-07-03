import { getTranslations } from 'next-intl/server'
import { SITE_CONFIG } from '@/lib/config'
import { formatPrice } from '@/lib/utils'

export async function AnnouncementBar() {
  const threshold = SITE_CONFIG.shipping.freeShippingThreshold
  const t = await getTranslations('announcement')
  return (
    <div className="bg-[#0A0A0A] text-center py-2.5 px-4">
      <p
        className="text-[10px] tracking-[0.25em] uppercase text-[#8C8577]"
        style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
      >
        {t.rich('freeShipping', {
          threshold: formatPrice(threshold),
          gold: (chunks) => <span style={{ color: SITE_CONFIG.brand.darkAccent }}>{chunks}</span>,
        })}
      </p>
    </div>
  )
}
