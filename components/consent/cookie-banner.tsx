'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useConsent } from '@/components/consent/consent-context'

/**
 * Bottom cookie-consent banner. Shown while the visitor is undecided, when the
 * stored choice is older than 12 months, or when re-opened from the footer's
 * "Cookie preferences" link. "Accept" enables the Meta Pixel, Google Analytics
 * and our consent-based visitor cookie; "Reject" (or withdrawing later) keeps
 * or turns them off. See components/consent/consent-context.tsx.
 */
export function CookieBanner() {
  const { consent, ready, setConsent, preferencesOpen } = useConsent()
  const t = useTranslations('cookieConsent')

  if (!ready || (consent !== null && !preferencesOpen)) return null

  return (
    <div
      role="dialog"
      aria-label={t('label')}
      className="fixed inset-x-0 bottom-0 z-50 border-t"
      style={{ background: '#141412', borderColor: '#2B2924' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <p
          className="text-[13px] leading-relaxed flex-1"
          style={{ color: '#c7c3b8', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
        >
          {t('message')}{' '}
          {preferencesOpen && consent && (
            <span style={{ color: '#EDE9E1' }}>{t(consent === 'granted' ? 'currentGranted' : 'currentDenied')} </span>
          )}
          <Link href="/privacy" className="underline underline-offset-2 hover:opacity-80" style={{ color: '#D9B679' }}>
            {t('learnMore')}
          </Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setConsent('denied')}
            className="px-4 py-2 text-[11px] uppercase tracking-[1.5px] border transition-colors hover:opacity-80"
            style={{ color: '#c7c3b8', borderColor: '#3a3833', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {t('reject')}
          </button>
          <button
            type="button"
            onClick={() => setConsent('granted')}
            className="px-4 py-2 text-[11px] uppercase tracking-[1.5px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#D9B679', color: '#141412', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
