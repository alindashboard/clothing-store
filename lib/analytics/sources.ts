/**
 * Traffic source for a visit: explicit UTM tags win (paid/social campaigns),
 * otherwise the referrer host is bucketed. `document.referrer` does not change
 * on client-side navigation, so every event of a visit carries the same one —
 * callers count sources per visitor-day, never per event.
 */
export const SOURCES = ['instagram', 'facebook', 'google', 'tiktok', 'other_site', 'direct'] as const
export type Source = (typeof SOURCES)[number]

export const SOURCE_LABELS: Record<Source, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  tiktok: 'TikTok',
  other_site: 'Other websites',
  direct: 'Direct / unknown',
}

const OWN_HOSTS = ['kayaoutlet.com', 'localhost', 'vercel.app']

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export function sourceFor(referrer: string | null | undefined, utmSource?: string | null): Source {
  const tag = (utmSource ?? '').toLowerCase()
  if (tag) {
    if (tag.includes('insta') || tag === 'ig') return 'instagram'
    if (tag.includes('facebook') || tag === 'fb' || tag.includes('meta')) return 'facebook'
    if (tag.includes('google')) return 'google'
    if (tag.includes('tiktok')) return 'tiktok'
    return 'other_site'
  }
  const host = referrer ? hostOf(referrer) : null
  if (!host || OWN_HOSTS.some((own) => host === own || host.endsWith(`.${own}`))) return 'direct'
  if (host.includes('instagram')) return 'instagram'
  if (host.includes('facebook') || host === 'fb.com' || host.endsWith('.fb.com')) return 'facebook'
  if (/(^|\.)google\./.test(host)) return 'google'
  if (host.includes('tiktok')) return 'tiktok'
  return 'other_site'
}
