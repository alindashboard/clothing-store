/**
 * Creates (POST) or removes (DELETE) the consent-based visitor cookie.
 *
 * POST is called by ConsentProvider only after the visitor clicks "Accept"
 * (and on later page loads while consent stands, as a no-op if the cookie
 * already exists). DELETE is called when consent is refused or withdrawn —
 * the cookie is HttpOnly, so the browser's own script cannot remove it.
 */
import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE, parseVisitorId } from '@/lib/analytics/visitor-cookie'

export async function POST(request: NextRequest) {
  const res = new NextResponse(null, { status: 204 })
  if (parseVisitorId(request.cookies.get(VISITOR_COOKIE)?.value)) return res

  res.cookies.set(VISITOR_COOKIE, randomUUID(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: VISITOR_COOKIE_MAX_AGE,
  })
  return res
}

export async function DELETE() {
  const res = new NextResponse(null, { status: 204 })
  res.cookies.set(VISITOR_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
