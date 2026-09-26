import { notFound } from 'next/navigation'

// Unknown paths under a locale (/it/whatever) would otherwise fall through to
// Next's bare default 404; routing them here renders app/[locale]/not-found.tsx
// with the header-less branded page. Specific routes always take precedence.
export default function CatchAllPage() {
  notFound()
}
