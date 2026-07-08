import { getTranslations } from 'next-intl/server'
import { SITE_CONFIG } from '@/lib/config'

export async function WipBanner() {
  if (!SITE_CONFIG.features.showWipBanner) return null

  const t = await getTranslations('wipBanner')

  return (
    <div
      className="text-center py-2 px-4"
      style={{ backgroundColor: SITE_CONFIG.brand.darkAccent }}
    >
      <p
        className="text-[10px] sm:text-xs tracking-[0.15em] uppercase text-[#141412] font-medium"
        style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
      >
        {t('message')}
      </p>
    </div>
  )
}
