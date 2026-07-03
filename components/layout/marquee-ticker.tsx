import type { SiteSettings } from '@/lib/brand-accent'

interface MarqueeTickerProps {
  settings: Pick<SiteSettings, 'tickerText' | 'tickerSeparator' | 'tickerSubtext' | 'tickerSpeed'>
  accent: string
}

/**
 * Scrolling ticker bar — "KAYA Studio Outlet ✦ New drop every week ✦ ..."
 *
 * Two identical spans side-by-side; CSS translateX(-50%) creates a seamless
 * infinite loop without JS. Speed comes from --ticker-speed CSS variable,
 * which is wired to the admin-configurable tickerSpeed value.
 *
 * The separator (✦) renders in the brand accent colour.
 */
export function MarqueeTicker({ settings, accent }: MarqueeTickerProps) {
  const { tickerText, tickerSeparator, tickerSubtext, tickerSpeed } = settings

  // One "unit" = text · subtext · — repeated inside each block for density.
  const unit = (
    <>
      <span style={{ color: '#7d7a72', marginRight: 32 }}>{tickerText}</span>
      <span style={{ color: accent, marginRight: 32 }}>{tickerSeparator}</span>
      <span style={{ color: '#7d7a72', marginRight: 32 }}>{tickerSubtext}</span>
      <span style={{ color: accent, marginRight: 32 }}>{tickerSeparator}</span>
    </>
  )

  return (
    <div
      className="overflow-hidden bg-[#0A0A0A] border-y"
      style={{ borderColor: '#2B2924', padding: '15px 0' }}
      aria-hidden="true"
    >
      {/* Track: two identical blocks for seamless loop */}
      <div
        className="kaya-ticker-track inline-block whitespace-nowrap"
        style={{ '--ticker-speed': `${tickerSpeed}s` } as React.CSSProperties}
      >
        {/* Block A */}
        <span className="inline-block">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-grotesk, var(--font-sans))',
                fontWeight: 500,
                fontSize: 12,
                lineHeight: 1,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                display: 'inline-block',
              }}
            >
              {unit}
            </span>
          ))}
        </span>
        {/* Block B — identical, creates seamless loop */}
        <span className="inline-block">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-grotesk, var(--font-sans))',
                fontWeight: 500,
                fontSize: 12,
                lineHeight: 1,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                display: 'inline-block',
              }}
            >
              {unit}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}
