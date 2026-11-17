/**
 * Login check for every request (Next.js 16 "proxy", formerly middleware).
 *
 * Let through:
 *  - staff with a valid session (Cognito login + MFA)
 *  - office TVs with a valid TV pass: viewing pages only, no write actions
 *  - public paths: /login and /auth/*, /tv/activate (TV key), /api/badges (API key),
 *    and Next.js assets
 * Everyone else: pages go to the login page, API calls get 401.
 */
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, readSession } from '@/lib/session'
import { TV_COOKIE, isValidTvPass } from '@/lib/tvAuth'

const PUBLIC_PREFIXES = ['/login', '/auth/', '/tv/activate', '/api/badges']

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value)
  if (session) return NextResponse.next()

  const isApi = pathname.startsWith('/api/')

  if (await isValidTvPass(req.cookies.get(TV_COOKIE)?.value)) {
    // TVs can view pages, but can't acknowledge, add notes, or call APIs
    if (!isApi && (req.method === 'GET' || req.method === 'HEAD')) return NextResponse.next()
    return NextResponse.json({ error: 'TV mode is read-only' }, { status: 403 })
  }

  if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const login = req.nextUrl.clone()
  login.pathname = '/login'
  login.search = `?returnTo=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(login)
}

export const config = {
  // Skip Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)'],
}