import { SITE_CONFIG } from '@/lib/config'

interface KayaMarkProps {
  /** Icon box + text size in px. Header/footer use different scales. */
  size?: number
  textClassName?: string
}

/**
 * Icon lockup from the "Kaya Outlet Landing (Final)" design: a gold-bordered
 * box containing a 5-ellipse leaf mark, paired with the short "KAYA" wordmark
 * in Archivo 900. Used in Header, Footer, and MobileNav — kept as one
 * component so the mark stays pixel-identical across all three.
 */
export function KayaMark({ size = 36, textClassName = 'text-[19px]' }: KayaMarkProps) {
  const accent = SITE_CONFIG.brand.darkAccent

  return (
    <span className="inline-flex items-center gap-3">
      <span
        className="inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size, border: `1.5px solid ${accent}` }}
        aria-hidden="true"
      >
        <svg width={size * 0.5} height={size * 0.36} viewBox="0 0 22 16" fill="none">
          <ellipse cx="11" cy="11" rx="6" ry="4.6" fill={accent} />
          <ellipse cx="4.2" cy="3.6" rx="2" ry="2.6" fill={accent} />
          <ellipse cx="9.4" cy="1.8" rx="2" ry="2.6" fill={accent} />
          <ellipse cx="14.4" cy="2.2" rx="2" ry="2.6" fill={accent} />
          <ellipse cx="18.8" cy="4.6" rx="1.8" ry="2.3" fill={accent} />
        </svg>
      </span>
      <span
        className={`font-black uppercase tracking-tight text-[#EDE9E1] ${textClassName}`}
        style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
      >
        KAYA
      </span>
    </span>
  )
}
