import Link from 'next/link'
import { fetchManualHandicappingWins } from '@/lib/fetchManualHandicappingWins'
import { fetchAcknowledgedHandicappingWins } from '@/lib/fetchAcknowledgedHandicappingWins'
import { fetchAcknowledgedHandicappingWinsNew } from '@/lib/fetchacknowledgedhandicappingwinsnew'
import ManualHandicappingWinsSourceToggle from './ManualHandicappingWinsSourceToggle'

export default async function ManualHandicappingWinsPage() {
  let comparison: Awaited<ReturnType<typeof fetchManualHandicappingWins>> | null = null
  let acknowledged: Awaited<ReturnType<typeof fetchAcknowledgedHandicappingWins>> = []
  let acknowledgedNew: Awaited<ReturnType<typeof fetchAcknowledgedHandicappingWinsNew>> = []
  let error: string | null = null

  try {
    const [comparisonResult, acknowledgedResult, acknowledgedNewResult] = await Promise.allSettled([
      fetchManualHandicappingWins(),
      fetchAcknowledgedHandicappingWins(),
      fetchAcknowledgedHandicappingWinsNew(),
    ])

    if (comparisonResult.status === 'fulfilled') {
      comparison = comparisonResult.value
    } else {
      error = String(comparisonResult.reason)
    }

    if (acknowledgedResult.status === 'fulfilled') acknowledged = acknowledgedResult.value
    if (acknowledgedNewResult.status === 'fulfilled') acknowledgedNew = acknowledgedNewResult.value
  } catch (err) {
    error = String(err)
  }

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
        </div>

        {error || !comparison ? (
          <div className="bg-rose-950 border border-rose-800 rounded-lg p-6 text-rose-300">
            Failed to load data: {error}
          </div>
        ) : (
          <ManualHandicappingWinsSourceToggle
            comparison={comparison}
            initialAcknowledged={acknowledged}
            initialAcknowledgedNew={acknowledgedNew}
          />
        )}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Manual Handicapping Wins
        </footer>
      </div>
    </div>
  )
}