'use client'

interface Props {
  size: 'lg' | 'xl'
}

/**
 * "NEW ARRIVALS" heading with two simultaneous CSS animations:
 *  1. na-shine  — gold sweep across the text every 5 s
 *  2. na-pulse  — gentle scale breathe (1 → 1.03 → 1) every 2 s
 *
 * Both target different CSS properties so they compose cleanly on
 * one element via comma-separated animation shorthand.
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
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        display: 'inline-block',
        lineHeight: 1,
        /* Shine: animated gradient reveals a gold highlight sweep */
        background:
          'linear-gradient(90deg, #141412 30%, #D9B679 44%, #EDE9E1 50%, #D9B679 56%, #141412 70%)',
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        /* Both animations on the same element — no flicker/strobe */
        animation: 'na-shine 5s linear infinite, na-pulse 2s ease-in-out infinite',
      }}
    >
      NEW ARRIVALS
    </span>
  )
}
