import Link from 'next/link'
import { fetchZeroTakeoutMonitor } from '@/lib/fetchZeroTakeoutMonitor'
import { fetchZeroTakeoutMonitorEtg } from '@/lib/fetchZeroTakeoutMonitorEtg'
import ZeroTakeoutMonitorClient from './ZeroTakeoutMonitorClient'

export const dynamic = 'force-dynamic'

export default async function ZeroTakeoutMonitorPage() {
  const [hhrResult, etgResult] = await Promise.allSettled([
    fetchZeroTakeoutMonitor(),
    fetchZeroTakeoutMonitorEtg(),
  ])

  const hhr = hhrResult.status === 'fulfilled' ? hhrResult.value : {
    checkdate: null, site_count: 0, data: [], cached_at: null,
    error: hhrResult.status === 'rejected' ? String(hhrResult.reason) : null
  }

  const etg = etgResult.status === 'fulfilled' ? etgResult.value : {
    checkdate: null, schema_count: 0, data: [], cached_at: null,
    error: etgResult.status === 'rejected' ? String(etgResult.reason) : null
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-6xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors">
          ← Back to Dashboard
        </Link>

        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎰</span>
            <h1 className="text-2xl font-bold text-white">Zero Takeout Monitor</h1>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Bets that generated zero house takeout — a sign of a possible game malfunction.
          </p>
        </div>

        <ZeroTakeoutMonitorClient hhr={hhr} etg={etg} />

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Zero Takeout Monitor
        </footer>
      </div>
    </div>
  )
}