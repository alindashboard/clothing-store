/**
 * Ingest endpoint for first-party site analytics (see lib/analytics/site-track.ts).
 *
 * Writes go through the service-role client so `analytics_events` can stay
 * RLS-locked to zero anon/authenticated access (see the migration). No IP is
 * ever persisted — only a same-day hash of it, for a rough unique-visitor
 * count, computed here and discarded.
 *
 * This is a fire-and-forget beacon: it always resolves 204, even on bad input
 * or a DB error, so a malformed or hostile payload can't be used to probe
 * validation behaviour and a Supabase hiccup never surfaces to the visitor.
 */
import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { isSiteEvent, type SiteEventPayload } from '@/lib/analytics/site-events'

// Namespaces the daily visitor hash — not a security secret, just keeps it from
// being a bare sha256(ip+ua+date) that anyone could precompute against known IPs.
const HASH_SALT = 'kaya-outlet-analytics-v1'

function deviceFromUserAgent(ua: string): 'mobile' | 'desktop' {
  return /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop'
}

function visitorHash(ip: string, userAgent: string): string {
  const utcDate = new Date().toISOString().slice(0, 10) // rotates daily, UTC
  return createHash('sha256').update(`${HASH_SALT}|${ip}|${userAgent}|${utcDate}`).digest('hex').slice(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text()
    const body = JSON.parse(raw) as Partial<SiteEventPayload>

    if (!isSiteEvent(body.event)) {
      return new NextResponse(null, { status: 204 })
    }

    // Belt-and-suspenders: the client already skips /admin (see site-track.ts),
    // but never let an admin session end up in visitor/traffic numbers.
    if (typeof body.path === 'string' && body.path.startsWith('/admin')) {
      return new NextResponse(null, { status: 204 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const country = request.headers.get('x-vercel-ip-country') || null

    const supabase = createSupabaseAdminClient()
    const row = {
      event: body.event,
      path: typeof body.path === 'string' ? body.path.slice(0, 512) : null,
      locale: typeof body.locale === 'string' ? body.locale.slice(0, 8) : null,
      referrer: typeof body.referrer === 'string' ? body.referrer.slice(0, 512) : null,
      product_id: typeof body.productId === 'string' ? body.productId : null,
      category: typeof body.category === 'string' ? body.category.slice(0, 128) : null,
      payment_method: typeof body.paymentMethod === 'string' ? body.paymentMethod.slice(0, 32) : null,
      value: typeof body.value === 'number' && Number.isFinite(body.value) ? body.value : null,
      device: deviceFromUserAgent(userAgent),
      country,
      visitor_hash: visitorHash(ip, userAgent),
    }
    const utm = {
      utm_source: typeof body.utmSource === 'string' ? body.utmSource.slice(0, 128) : null,
      utm_medium: typeof body.utmMedium === 'string' ? body.utmMedium.slice(0, 128) : null,
      utm_campaign: typeof body.utmCampaign === 'string' ? body.utmCampaign.slice(0, 128) : null,
    }

    let { error } = await supabase.from('analytics_events').insert({ ...row, ...utm })
    // PGRST204 = unknown column: the utm migration isn't applied yet. Keep
    // recording the event without the tags rather than losing it.
    if (error?.code === 'PGRST204') {
      ;({ error } = await supabase.from('analytics_events').insert(row))
    }

    if (error) console.error('[analytics] insert failed:', error.message)
  } catch (err) {
    console.error('[analytics] request failed:', err)
  }

  return new NextResponse(null, { status: 204 })
}
