import Link from 'next/link'
import { fetchManualHandicappingWins } from '@/lib/fetchManualHandicappingWins'
import { fetchAcknowledgedHandicappingWins } from '@/lib/fetchAcknowledgedHandicappingWins'
import ManualHandicappingWinsSourceToggle from './ManualHandicappingWinsSourceToggle'

export default async function ManualHandicappingWinsPage() {
  let comparison: Awaited<ReturnType<typeof fetchManualHandicappingWins>> | null = null
  let acknowledged: Awaited<ReturnType<typeof fetchAcknowledgedHandicappingWins>> = []
  let error: string | null = null

  try {
    [comparison, acknowledged] = await Promise.all([
      fetchManualHandicappingWins(),
      fetchAcknowledgedHandicappingWins(),
    ])
  } catch (err) {
    error = String(err)
  }

  const legacyData = comparison?.legacy

  const updatedTimestamp = legacyData?.cached_at
    ? new Date(legacyData.cached_at.replace(' UTC', 'Z').replace(' ', 'T')).toLocaleString('en-US', {
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
      <div className="max-w-5xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors">
          ← Back to Dashboard
        </Link>

        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <h1 className="text-2xl font-bold text-white">Manual Handicapping Wins</h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Sites with active manual handicapping activity — sorted by payout %.
          </p>

          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 relative group cursor-help">
              <span className="text-slate-500 text-xs uppercase tracking-widest">Updated</span>
              <span className="text-slate-200 text-xs font-semibold">{updatedTimestamp}</span>
              <span className="absolute top-full left-0 mt-2 w-64 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
                The last time this report was generated and cached (legacy).
              </span>
            </div>
            <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2">
              <span className="text-slate-500 text-xs uppercase tracking-widest">Refreshes</span>
              <span className="text-slate-200 text-xs font-semibold">Every 2 hours</span>
            </div>
            {legacyData?.checkdate && (
              <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 relative group cursor-help">
                <span className="text-slate-500 text-xs uppercase tracking-widest">Lookback</span>
                <span className="text-slate-200 text-xs font-semibold">
                  {legacyData.checkdate.split('T')[0] || legacyData.checkdate.split(' ')[0]}
                </span>
                <span className="absolute top-full left-0 mt-2 w-64 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
                  Start of the 96-hour data window. Only transactions after this date/time are included in this report.
                </span>
              </div>
            )}
          </div>
        </div>

        {error || !comparison ? (
          <div className="bg-rose-950 border border-rose-800 rounded-lg p-6 text-rose-300">
            Failed to load data: {error}
          </div>
        ) : (
          <ManualHandicappingWinsSourceToggle
            comparison={comparison}
            initialAcknowledged={acknowledged}
          />
        )}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Manual Handicapping Wins
        </footer>
      </div>
    </div>
  )
}