'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useTransition } from 'react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchLocale(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div
      className={`flex items-center gap-0.5 text-[10px] font-semibold tracking-[0.15em] transition-opacity ${isPending ? 'opacity-40' : ''}`}
      aria-label="Language"
    >
      <button
        onClick={() => switchLocale('it')}
        className={`px-1.5 py-0.5 transition-colors ${
          locale === 'it'
            ? 'text-[#EDE9E1]'
            : 'text-[#8C8577] hover:text-[#c7c3b8]'
        }`}
        aria-pressed={locale === 'it'}
      >
        IT
      </button>
      <span className="text-[#2B2924] select-none">|</span>
      <button
        onClick={() => switchLocale('en')}
        className={`px-1.5 py-0.5 transition-colors ${
          locale === 'en'
            ? 'text-[#EDE9E1]'
            : 'text-[#8C8577] hover:text-[#c7c3b8]'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
    </div>
  )
}
