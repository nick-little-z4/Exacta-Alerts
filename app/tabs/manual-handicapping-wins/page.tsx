import Link from 'next/link'
import { fetchManualHandicappingWins } from '@/lib/fetchManualHandicappingWins'
import { fetchAcknowledgedHandicappingWins } from '@/lib/fetchAcknowledgedHandicappingWins'
import ManualHandicappingWinsClient from './ManualHandicappingWinsClient'

export default async function ManualHandicappingWinsPage() {
  let data: Awaited<ReturnType<typeof fetchManualHandicappingWins>> | null = null
  let acknowledged: Awaited<ReturnType<typeof fetchAcknowledgedHandicappingWins>> = []
  let error: string | null = null

  try {
    [data, acknowledged] = await Promise.all([
      fetchManualHandicappingWins(),
      fetchAcknowledgedHandicappingWins(),
    ])
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

          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2">
              <span className="text-slate-500 text-xs uppercase tracking-widest">Refreshes</span>
              <span className="text-slate-200 text-xs font-semibold">Every 2 hours</span>
            </div>
            {data?.checkdate && (
              <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2">
                <span className="text-slate-500 text-xs uppercase tracking-widest">Lookback</span>
                <span className="text-slate-200 text-xs font-semibold">
                  {data.checkdate.split('T')[0] || data.checkdate.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="bg-rose-950 border border-rose-800 rounded-lg p-6 text-rose-300">
            Failed to load data: {error}
          </div>
        ) : (
          <ManualHandicappingWinsClient
            rows={data?.data ?? []}
            checkdate={data?.checkdate ?? null}
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