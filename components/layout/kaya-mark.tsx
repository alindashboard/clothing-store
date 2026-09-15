interface KayaMarkProps {
  /** Text size. Header/footer use different scales. */
  textClassName?: string
}

/**
 * "KAYA" wordmark in Archivo 900. Used in Header, Footer, and MobileNav —
 * kept as one component so the mark stays pixel-identical across all three.
 */
export function KayaMark({ textClassName = 'text-[19px]' }: KayaMarkProps) {
  return (
    <span
      className={`font-black uppercase tracking-tight text-[#EDE9E1] ${textClassName}`}
      style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
    >
      KAYA
    </span>
  )
}
