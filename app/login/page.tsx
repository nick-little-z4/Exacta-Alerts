'use client'

/**
 * /login: Exacta Alerts sign-in, sign-up, email code and authenticator MFA,
 * all on this page (Amplify Authenticator), same approach as our other app.
 *
 * After Cognito signs the user in, the ID token is sent to /auth/session,
 * which verifies it and starts the dashboard session cookie that proxy.ts checks.
 */
import { useEffect, useRef, useState } from 'react'
import { Amplify } from 'aws-amplify'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { amplifyConfig } from '@/lib/amplifyConfig'

Amplify.configure(amplifyConfig)

function safeReturnTo(v: string | null): string {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '/'
}

/** Runs once Cognito has signed the user in: start the dashboard session */
function StartSession() {
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      try {
        const session = await fetchAuthSession()
        const idToken = session.tokens?.idToken?.toString()
        if (!idToken) throw new Error('No sign-in token')
        const res = await fetch('/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? 'Sign-in was not accepted')
        }
        const returnTo = safeReturnTo(new URLSearchParams(window.location.search).get('returnTo'))
        window.location.replace(returnTo)
      } catch (e) {
        setError(String(e instanceof Error ? e.message : e))
        await signOut().catch(() => {})
      }
    })()
  }, [])

  return (
    <p className="text-center text-sm text-slate-300 py-6">
      {error ? <span className="text-rose-400">{error}. Please reload and try again.</span> : 'Signing you in…'}
    </p>
  )
}

export default function LoginPage() {
  // Coming from Sign out: clear Amplify's saved login first, so it can't auto sign back in
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const signedOut = new URLSearchParams(window.location.search).get('signedout') === '1'
    if (signedOut) signOut().catch(() => {}).finally(() => setReady(true))
    else setReady(true)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0b14] flex flex-col items-center justify-center px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-orange-400 to-pink-500" />
        <h1 className="text-2xl font-bold text-white tracking-tight">Exacta Alerts</h1>
      </div>
      {ready && (
        <ThemeProvider colorMode="dark">
          <Authenticator loginMechanisms={['email']} signUpAttributes={['email']}>
            {() => <StartSession />}
          </Authenticator>
        </ThemeProvider>
      )}
    </div>
  )
}