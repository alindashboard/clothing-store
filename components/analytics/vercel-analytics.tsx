'use client'

import { Analytics } from '@vercel/analytics/next'
import { isInternalVisitor } from '@/lib/analytics/internal-visitor'

// Client wrapper so beforeSend (a function) can drop the owner's own traffic.
export function VercelAnalytics() {
  return <Analytics beforeSend={(event) => (isInternalVisitor() ? null : event)} />
}
