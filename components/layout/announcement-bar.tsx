import { getTranslations } from 'next-intl/server'
import { SITE_CONFIG } from '@/lib/config'
import { formatPrice } from '@/lib/utils'

export async function AnnouncementBar() {
  const threshold = SITE_CONFIG.shipping.freeShippingThreshold
  const t = await getTranslations('announcement')
  return (
    <div className="bg-black text-white text-center py-2 px-4">
      <p className="text-xs tracking-widest uppercase">
        {t('freeShipping', { threshold: formatPrice(threshold) })}
      </p>
    </div>
  )
}
