import React from 'react'
import Link from 'next/link'
import { fetchManualHandicappingWins, WinRow } from '@/lib/fetchManualHandicappingWins'

export default async function ManualHandicappingWinsPage() {
  let data: Awaited<ReturnType<typeof fetchManualHandicappingWins>> | null = null
  let error: string | null = null

  try {
    data = await fetchManualHandicappingWins()
  } catch (err) {
    error = String(err)
  }

  const rows: WinRow[] = data?.data ?? []
  const sorted = [...rows].sort((a, b) => parseFloat(b.payout) - parseFloat(a.payout))

  // Top section: payout >= 100% AND net_win >= 100 (millions)
  const alerts = sorted.filter(
    r => parseFloat(r.payout) >= 100 && (r.net_win ?? 0) >= 100
  )
  const normal = sorted.filter(
    r => !(parseFloat(r.payout) >= 100 && (r.net_win ?? 0) >= 100)
  )

  const checkdate = data?.checkdate ?? null

  function fmt(val: number) {
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-5xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors">
          ← Back to Dashboard
        </Link>

        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <h1 className="text-2xl font-bold text-white">Manual Handicapping Wins</h1>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Sites with active manual handicapping activity — sorted by payout %.
          </p>

          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2">
              <span className="text-slate-500 text-xs uppercase tracking-widest">Refreshes</span>
              <span className="text-slate-200 text-xs font-semibold">Every 2 hours</span>
            </div>
            {checkdate && (
              <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2">
                <span className="text-slate-500 text-xs uppercase tracking-widest">Lookback</span>
                <span className="text-slate-200 text-xs font-semibold">
                {checkdate ? checkdate.split('T')[0] || checkdate.split(' ')[0] : ''}
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
          <>
            {/* Alert section — always visible */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-rose-400 font-bold text-sm uppercase tracking-widest">
                  ⚠ Payout ≥ 100% &amp; Net Win ≥ $100
                </span>
              </div>
              <div className="bg-[#13152a] border border-rose-900 rounded-lg overflow-hidden">
                {alerts.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Site</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Payout %</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Wager</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Prizes</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Win</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plays</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map((row, i) => (
                        <tr key={i} className="border-t border-slate-800 hover:bg-[#1a1d35] transition-colors">
                          <td className="px-4 py-2.5 text-white font-medium">{row.sitename}</td>
                          <td className="text-right px-4 py-2.5 text-rose-400 font-bold tabular-nums">{row.payout}</td>
                          <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{fmt(row.wager)}</td>
                          <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{fmt(row.prizes ?? 0)}</td>
                          <td className="text-right px-4 py-2.5 font-semibold tabular-nums text-rose-400">
                            {fmt(row.net_win ?? 0)}
                          </td>
                          <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{row.plays.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-slate-500 text-sm px-4 py-6">No sites currently flagged.</p>
                )}
              </div>
            </div>

            {/* All other sites */}
            {normal.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">All Other Sites</span>
                </div>
                <div className="bg-[#13152a] border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Site</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Payout %</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Wager</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Prizes</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Win</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plays</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normal.map((row, i) => (
                        <tr key={i} className="border-t border-slate-800 hover:bg-[#1a1d35] transition-colors">
                          <td className="px-4 py-2.5 text-slate-200">{row.sitename}</td>
                          <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{row.payout}</td>
                          <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{fmt(row.wager)}</td>
                          <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{fmt(row.prizes ?? 0)}</td>
                          <td className={`text-right px-4 py-2.5 tabular-nums ${(row.net_win ?? 0) > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {fmt(row.net_win ?? 0)}
                          </td>
                          <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{row.plays.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {rows.length === 0 && (
              <div className="bg-[#13152a] border border-slate-800 rounded-lg p-10 text-center text-slate-500">
                No data available for the last 96 hours.
              </div>
            )}
          </>
        )}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Manual Handicapping Wins
        </footer>
      </div>
    </div>
  )
}