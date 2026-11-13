import { NextRequest, NextResponse } from 'next/server'
import { TV_COOKIE, createTvPass, isValidTvKey } from '@/lib/tvAuth'

export const dynamic = 'force-dynamic'

/**
 * GET /tv/activate?key=<TV_ACCESS_KEY>
 * Run once on each office TV: saves a read-only TV pass cookie, then starts TV mode.
 * A wrong or missing key gets a plain 404, so the link can't be guessed.
 */
export async function GET(req: NextRequest) {
  if (!isValidTvKey(req.nextUrl.searchParams.get('key'))) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { value, expires } = await createTvPass()
  // Send the TV to the home page with ?tvstart=1, which turns TV mode on.
  // Build the URL from the forwarded host: on Amplify, req.url is the internal
  // server address (localhost:3000), not alerts.exactasystems.com.
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host
  const proto = req.headers.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const res = NextResponse.redirect(`${proto}://${host}/?tvstart=1`)
  res.cookies.set(TV_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  })
  return res
}