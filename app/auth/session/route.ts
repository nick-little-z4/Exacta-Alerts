import { NextRequest, NextResponse } from 'next/server'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { SESSION_COOKIE, createSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

const ALLOWED_DOMAIN = (process.env.AUTH_ALLOWED_EMAIL_DOMAIN || 'exactasystems.com').toLowerCase()

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
  clientId: process.env.COGNITO_CLIENT_ID ?? '',
  tokenUse: 'id',
})

/**
 * POST /auth/session  { idToken }
 * Called by /login after Cognito sign-in (with MFA). Checks the token's
 * signature, expiry, pool and client, plus a verified company email, then
 * starts the dashboard session cookie.
 */
export async function POST(req: NextRequest) {
  let idToken = ''
  try {
    idToken = (await req.json()).idToken ?? ''
  } catch {
    // handled below
  }
  if (!idToken) return NextResponse.json({ error: 'Missing sign-in token' }, { status: 400 })

  let claims: Record<string, unknown>
  try {
    claims = (await verifier.verify(idToken)) as unknown as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Sign-in could not be verified' }, { status: 401 })
  }

  const email = String(claims.email ?? '').toLowerCase()
  if (claims.email_verified !== true || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return NextResponse.json({ error: 'This account is not allowed' }, { status: 403 })
  }

  const { value, expires } = await createSession(email)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  })
  return res
}