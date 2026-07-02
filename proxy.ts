import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/admin')) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isLoginPage = pathname === '/admin/login'

    if (!user && !isLoginPage) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    if (user && isLoginPage) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    return supabaseResponse
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|robots\\.txt|sitemap\\.xml|.*\\..*).*)'],
}
