import Link from 'next/link'
import { fetchLowPools } from '@/lib/fetchLowPools'
import { fetchRoulettePool } from '@/lib/fetchRoulettePool'
import LowPoolsSourceToggle from './LowPoolsSourceToggle'

export const dynamic = 'force-dynamic'

export default async function LowPoolsPage() {
  const [comparison, rouletteData] = await Promise.all([
    fetchLowPools(),
    fetchRoulettePool().catch(err => {
      console.error('[LowPoolsPage] roulette fetch failed:', err)
      return null
    }),
  ])

  const timestamp = comparison.legacy.last_run
    ? new Date(comparison.legacy.last_run.replace(' ', 'T') + 'Z').toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) + ' CDT'
    : 'Unknown'

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-6xl mx-auto">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        <div className="border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <h1 className="text-2xl font-bold text-white">Low Pools</h1>
          </div>
        </div>
          <p className="text-slate-400 text-sm mt-3">
            Games with critically low pool balances.
          </p>
          <div className="mt-4 flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 w-fit relative group cursor-help">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Updated</span>
            <span className="text-slate-200 text-xs font-semibold">{timestamp}</span>
            <span className="absolute top-full left-0 mt-2 w-64 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
              Reference last update from pool monitor daily table (legacy).
            </span>
          </div>
        </div>

        <LowPoolsSourceToggle comparison={comparison} rouletteData={rouletteData} />

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Low Pools
        </footer>

      </div>
    </div>
  )
}