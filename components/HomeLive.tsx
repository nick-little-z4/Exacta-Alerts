'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Keeps the home page live on wall displays:
// - shows the alert count in the browser tab title
// - re-fetches the page data every few minutes
export default function HomeLive({ totalAlerts, refreshMinutes = 5 }: { totalAlerts: number; refreshMinutes?: number }) {
  const router = useRouter()

  useEffect(() => {
    document.title = totalAlerts > 0 ? `(${totalAlerts}) Exacta Alerts` : 'Exacta Alerts'
  }, [totalAlerts])

  useEffect(() => {
    const id = setInterval(() => router.refresh(), refreshMinutes * 60 * 1000)
    return () => clearInterval(id)
  }, [router, refreshMinutes])

  return null
}