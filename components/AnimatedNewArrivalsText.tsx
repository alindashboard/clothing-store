'use client'

interface Props {
  size: 'lg' | 'xl'
}

/**
 * "NEW ARRIVALS" heading: solid heavy Archivo per the landing design,
 * with a subtle na-pulse scale breathe (1 → 1.03 → 1) every 2 s.
 */
export function AnimatedNewArrivalsText({ size }: Props) {
  const fontSize =
    size === 'xl'
      ? 'clamp(52px, 9vw, 108px)'
      : 'clamp(36px, 5.5vw, 68px)'

  return (
    <span
      style={{
        fontFamily: 'var(--font-archivo, var(--font-sans))',
        fontWeight: 900,
        fontSize,
        letterSpacing: '-0.02em',
        textTransform: 'uppercase',
        display: 'inline-block',
        lineHeight: 1,
        color: '#EDE9E1',
        animation: 'na-pulse 2s ease-in-out infinite',
      }}
    >
      NEW ARRIVALS
    </span>
  )
}
