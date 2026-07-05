interface CornerBracketsProps {
  color?: string
  size?: number
}

/**
 * Four absolutely-positioned gold corner brackets, used to decorate CTA
 * buttons across the dark KAYA chrome (store page directions/WhatsApp,
 * events page RSVP links). Parent must be `position: relative`.
 */
export function CornerBrackets({ color = '#D9B679', size = 10 }: CornerBracketsProps) {
  return (
    <>
      <span className="absolute top-0 left-0" style={{ width: size, height: size, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <span className="absolute top-0 right-0" style={{ width: size, height: size, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <span className="absolute bottom-0 left-0" style={{ width: size, height: size, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <span className="absolute bottom-0 right-0" style={{ width: size, height: size, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
    </>
  )
}
