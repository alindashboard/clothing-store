import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { CornerBrackets } from '@/components/layout/corner-brackets'
import { SITE_CONFIG } from '@/lib/config'

type Variant = 'solid' | 'outline'

interface KayaCtaBaseProps {
  children: ReactNode
  /** solid = gold fill + dark text (primary action); outline = hairline box + cream text. */
  variant?: Variant
  icon?: ReactNode
  className?: string
}

type KayaCtaProps = KayaCtaBaseProps &
  (
    | { href: string; external?: boolean; type?: never; disabled?: never; onClick?: () => void }
    | { href?: never; external?: never; type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void }
  )

const GOLD = SITE_CONFIG.brand.darkAccent

/**
 * Bracketed CTA of the dark KAYA chrome — same visual language as the PDP's
 * AddToCartButton (gold fill + gold corners) and the hero CTA. Renders a locale
 * Link for internal hrefs, a plain <a> for external ones, or a <button>.
 */
export function KayaCta({ children, variant = 'solid', icon, className = '', ...rest }: KayaCtaProps) {
  const solid = variant === 'solid'
  const classes = `group relative inline-flex items-center justify-center gap-2.5 min-h-[52px] px-7 py-3.5 text-xs font-semibold tracking-[0.22em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    solid ? 'hover:bg-[#e6c894]' : 'border border-[#2B2924] hover:bg-[#EDE9E1]/[0.04]'
  } ${className}`
  const style = {
    background: solid ? GOLD : 'transparent',
    color: solid ? '#141412' : '#EDE9E1',
    fontFamily: 'var(--font-grotesk, var(--font-sans))',
  }
  const inner = (
    <>
      <CornerBrackets color={GOLD} size={10} />
      {icon}
      <span>{children}</span>
    </>
  )

  if ('href' in rest && rest.href) {
    if (rest.external) {
      return (
        <a href={rest.href} target="_blank" rel="noopener noreferrer" className={classes} style={style}>
          {inner}
        </a>
      )
    }
    return (
      <Link href={rest.href} prefetch={false} onClick={rest.onClick} className={classes} style={style}>
        {inner}
      </Link>
    )
  }

  const { type = 'button', disabled, onClick } = rest as { type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes} style={style}>
      {inner}
    </button>
  )
}
