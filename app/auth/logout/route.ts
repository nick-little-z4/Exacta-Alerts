import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, appUrl } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** GET /auth/logout: ends the dashboard session, then /login clears Amplify's saved login */
export async function GET(_req: NextRequest) {
  const res = NextResponse.redirect(appUrl('/login?signedout=1'))
  res.cookies.delete(SESSION_COOKIE)
  return res
}