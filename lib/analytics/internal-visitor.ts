/**
 * Flags the owner's own browsers so their browsing and test orders don't
 * pollute storefront analytics. Set by AdminShell (only rendered for a
 * logged-in admin), so any device that has opened /admin once is excluded
 * from site analytics, Meta Pixel events and Vercel Web Analytics — including
 * later storefront visits on that device. Clearing site data resets it.
 */
const KEY = 'kaya-internal-visitor'

export function markInternalVisitor() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // storage disabled — nothing we can do
  }
}

export function isInternalVisitor(): boolean {
  try {
    return typeof window !== 'undefined' && localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
