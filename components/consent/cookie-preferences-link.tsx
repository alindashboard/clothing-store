'use client'

import { useTranslations } from 'next-intl'
import { useConsent } from '@/components/consent/consent-context'

/** Footer entry point to change or withdraw cookie consent at any time. */
export function CookiePreferencesLink({ className }: { className?: string }) {
  const { openPreferences } = useConsent()
  const t = useTranslations('cookieConsent')
  return (
    <button type="button" onClick={openPreferences} className={className}>
      {t('preferences')}
    </button>
  )
}
