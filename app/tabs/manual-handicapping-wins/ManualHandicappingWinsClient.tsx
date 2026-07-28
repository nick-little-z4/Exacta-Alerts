'use client'

import { useState } from 'react'
import { WinRow } from '@/lib/fetchManualHandicappingWins'
import { AcknowledgedHandicappingWin } from '@/lib/fetchAcknowledgedHandicappingWins'

function rowKey(sitename: string, checkdate: string) {
  const normalized = checkdate.replace(' ', 'T').split('.')[0]
  return `${sitename}-${normalized}`
}

function fmt(val: number) {
  return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ManualHandicappingWinsClient({
  rows,
  checkdate,
  initialAcknowledged,
}: {
  rows: WinRow[]
  checkdate: string | null
  initialAcknowledged: AcknowledgedHandicappingWin[]
}) {
const [acknowledgedKeys, setAcknowledgedKeys] = useState<Set<string>>(
  () => new Set(initialAcknowledged.map(a => rowKey(a.sitename, a.checkdate)))
)
console.log('checkdate prop:', JSON.stringify(checkdate))
console.log('initialAcknowledged:', JSON.stringify(initialAcknowledged))
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sorted = [...rows].sort((a, b) => parseFloat(b.payout) - parseFloat(a.payout))

  const alerts = sorted.filter(
    r => parseFloat(r.payout) >= 100 && (r.net_win ?? 0) >= 100
  )
  const normal = sorted.filter(
    r => !(parseFloat(r.payout) >= 100 && (r.net_win ?? 0) >= 100)
  )

  const handleToggle = async (row: WinRow) => {
    const cd = checkdate ?? ''
    const key = rowKey(row.sitename, cd)
    const isAcked = acknowledgedKeys.has(key)
    setLoadingKey(key)
    setError(null)

    // Optimistic update
    setAcknowledgedKeys(prev => {
      const next = new Set(prev)
      if (isAcked) next.delete(key)
      else next.add(key)
      return next
    })

    try {
      const res = await fetch('/api/handicapping-acknowledge', {
        method: isAcked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitename: row.sitename, checkdate: cd }),
      })
      if (!res.ok) throw new Error('Request failed')
    } catch {
      // Revert on failure
      setAcknowledgedKeys(prev => {
        const next = new Set(prev)
        if (isAcked) next.add(key)
        else next.delete(key)
        return next
      })
      setError('Failed to update acknowledgement. Please try again.')
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-6 px-4 py-3 bg-rose-950 border border-rose-700 rounded-lg text-rose-300 text-sm">
          {error}
        </div>
      )}

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
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((row, i) => {
                  const key = rowKey(row.sitename, checkdate ?? '')
                  const isAcked = acknowledgedKeys.has(key)
                  const isLoading = loadingKey === key
                  return (
                    <tr key={i} className={`border-t border-slate-800 hover:bg-[#1a1d35] transition-colors ${isAcked ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-2.5 text-white font-medium">{row.sitename}</td>
                      <td className="text-right px-4 py-2.5 text-rose-400 font-bold tabular-nums">{row.payout}</td>
                      <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{fmt(row.wager)}</td>
                      <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{fmt(row.prizes ?? 0)}</td>
                      <td className="text-right px-4 py-2.5 font-semibold tabular-nums text-rose-400">
                        {fmt(row.net_win ?? 0)}
                      </td>
                      <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">{row.plays.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5">
                        <button
                          onClick={() => handleToggle(row)}
                          disabled={isLoading}
                          className={`text-xs px-3 py-1 rounded border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            isAcked
                              ? 'border-emerald-800 text-emerald-500 bg-emerald-950/20 hover:border-rose-500 hover:text-rose-400'
                              : 'border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/30'
                          }`}
                        >
                          {isAcked ? '✅ Acknowledged' : 'Acknowledge'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm px-4 py-6">No sites currently flagged.</p>
          )}
        </div>
      </div>

      {/* All other sites — no acknowledge button */}
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
  )
}