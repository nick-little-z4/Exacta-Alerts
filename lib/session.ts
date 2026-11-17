/**
 * Staff login session.
 *
 * After Cognito login (with MFA), /auth/callback gives the browser a signed
 * session cookie that lasts AUTH_SESSION_DAYS (default 7). proxy.ts checks it on
 * every request. Signed with AUTH_SESSION_SECRET; changing that secret logs
 * everyone out. Uses Web Crypto so it works in proxy.ts.
 */

export const SESSION_COOKIE = 'exacta_session'
export const SESSION_DAYS = Math.max(1, Number(process.env.AUTH_SESSION_DAYS) || 7)

const enc = new TextEncoder()

function b64url(bytes: Uint8Array): string {
  let s = ''
  bytes.forEach(b => { s += String.fromCharCode(b) })
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
}

async function hmac(value: string): Promise<string> {
  const secret = process.env.AUTH_SESSION_SECRET
  if (!secret) throw new Error('AUTH_SESSION_SECRET is not configured')
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value))))
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export interface Session {
  email: string
  exp: number // ms
}

/** Cookie value: "<base64url json>.<signature>" */
export async function createSession(email: string): Promise<{ value: string; expires: Date }> {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const payload = b64url(enc.encode(JSON.stringify({ email, exp: expires.getTime() })))
  return { value: `${payload}.${await hmac(payload)}`, expires }
}

export async function readSession(value: string | undefined | null): Promise<Session | null> {
  if (!value) return null
  const [payload, sig] = value.split('.')
  if (!payload || !sig) return null
  try {
    if (!safeEqual(sig, await hmac(payload))) return null
    const s = JSON.parse(b64urlDecode(payload)) as Session
    if (!s.email || !s.exp || s.exp < Date.now()) return null
    return s
  } catch {
    return null
  }
}

/** Random string for OAuth state and PKCE */
export function randomString(bytes = 32): string {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return b64url(a)
}

export async function pkceChallenge(verifier: string): Promise<string> {
  return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(verifier))))
}

/** The site's public address (APP_URL), never the internal server address */
export function appUrl(path = ''): string {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${base}${path}`
}

/** Only allow redirects back to our own pages */
export function safeReturnTo(v: string | null | undefined): string {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '/'
}