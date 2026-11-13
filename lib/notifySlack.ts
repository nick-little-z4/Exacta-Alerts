import { after } from 'next/server'

/**
 * Ask the Slack notifier to check right away (used after an acknowledgement),
 * so the "cleared" message posts immediately instead of at the next 15-minute run.
 *
 * Runs after the response is sent, so the acknowledge click is not slowed down.
 * Failures are only logged: the 15-minute check will still catch it.
 */
export function notifySlackSoon() {
  after(async () => {
    try {
      const res = await fetch(`${process.env.EXACTA_API_BASE_URL}/alerts/notify`, {
        method: 'POST',
        headers: { 'x-api-key': process.env.EXACTA_API_KEY ?? '', 'Content-Type': 'application/json' },
        body: '{}',
        cache: 'no-store',
      })
      if (!res.ok) console.log('[notifySlack] notifier returned', res.status)
    } catch (err) {
      console.log('[notifySlack] failed:', err)
    }
  })
}