import { useTranslations } from 'next-intl'
import { KayaCta } from '@/components/layout/kaya-cta'
import { SITE_CONFIG } from '@/lib/config'

export default function NotFound() {
  const t = useTranslations('common')
  return (
    <div className="dark kaya-dark flex flex-col items-center justify-center min-h-screen px-4 text-center gap-5">
      <p
        className="text-xs tracking-[0.3em] uppercase"
        style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
      >
        404
      </p>
      <h1
        className="font-black uppercase leading-none text-[#EDE9E1]"
        style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: 'clamp(30px, 5vw, 56px)', letterSpacing: '-0.02em' }}
      >
        {t('notFoundTitle')}
      </h1>
      <p className="text-[#8C8577] max-w-sm mb-3">{t('notFoundBody')}</p>
      <KayaCta href="/" variant="outline">{t('backHome')}</KayaCta>
    </div>
  )
}
