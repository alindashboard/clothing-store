import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { SITE_CONFIG } from '@/lib/config'

interface DarkPageHeaderProps {
  title: string
  /** Small gold uppercase line above the title. */
  eyebrow?: string
  /** Breadcrumb: "Home / {current}". Omit homeLabel to hide it. */
  homeLabel?: string
  current?: string
  /** Rendered under the title (e.g. "last updated", a back link). */
  children?: ReactNode
  /** Narrower column for text pages (legal) vs full width (cart/checkout). */
  narrow?: boolean
}

/**
 * Breadcrumb + eyebrow + Archivo title block shared by the dark pages that
 * have no bespoke design (legal, cart, checkout) — same markup/colours as the
 * category and store page headers.
 */
export function DarkPageHeader({ title, eyebrow, homeLabel, current, children, narrow }: DarkPageHeaderProps) {
  const width = narrow ? 'max-w-3xl' : 'max-w-7xl'
  return (
    <>
      {homeLabel && (
        <nav
          className={`${width} mx-auto px-4 pt-6 text-xs tracking-wide`}
          style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: '#6b6862' }}
          aria-label="Breadcrumb"
        >
          <Link href="/" prefetch={false} className="hover:text-[#c7c3b8] transition-colors">{homeLabel}</Link>
          <span className="mx-2" style={{ color: '#3a3833' }}>/</span>
          <span style={{ color: '#c7c3b8' }}>{current ?? title}</span>
        </nav>
      )}
      <div className={`${width} mx-auto px-4 pt-7 pb-8 md:pb-10 mb-8 md:mb-10 border-b`} style={{ borderColor: '#2B2924' }}>
        {eyebrow && (
          <p
            className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-2.5 md:mb-3.5"
            style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="font-black uppercase leading-none text-[#EDE9E1]"
          style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: 'clamp(30px, 4.5vw, 52px)', letterSpacing: '-0.02em' }}
        >
          {title}
        </h1>
        {children && <div className="mt-4 text-sm text-[#8C8577]">{children}</div>}
      </div>
    </>
  )
}
