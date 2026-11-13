/**
 * TV access pass.
 *
 * /tv/activate?key=<TV_ACCESS_KEY> gives a TV browser a signed cookie that lasts
 * TV_PASS_DAYS. Later, the Cognito middleware lets requests with a valid pass
 * view pages without logging in, and write actions (acknowledge, notes) reject it.
 *
 * The cookie is signed with TV_ACCESS_KEY, so changing that key cancels every TV pass.
 * Uses Web Crypto so it also works in middleware.
 */

export const TV_COOKIE = 'exacta_tv_pass'
export const TV_PASS_DAYS = 90

const enc = new TextEncoder()

async function hmac(value: string): Promise<string> {
  const secret = process.env.TV_ACCESS_KEY
  if (!secret) throw new Error('TV_ACCESS_KEY is not configured')
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time string compare */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** True when the key in the activate link is right */
export function isValidTvKey(key: string | null): boolean {
  const expected = process.env.TV_ACCESS_KEY
  return !!expected && !!key && safeEqual(key, expected)
}

/** Cookie value: "<expires ms>.<signature>" */
export async function createTvPass(): Promise<{ value: string; expires: Date }> {
  const expires = new Date(Date.now() + TV_PASS_DAYS * 24 * 60 * 60 * 1000)
  const exp = String(expires.getTime())
  return { value: `${exp}.${await hmac(exp)}`, expires }
}

/** True when the cookie is a valid, unexpired TV pass */
export async function isValidTvPass(value: string | undefined | null): Promise<boolean> {
  if (!value) return false
  const [exp, sig] = value.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  try {
    return safeEqual(sig, await hmac(exp))
  } catch {
    return false
  }
}