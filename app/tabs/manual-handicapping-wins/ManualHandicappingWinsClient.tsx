'use client'

import { useState } from 'react'
import { WinRow } from '@/lib/fetchManualHandicappingWins'
import { AcknowledgedHandicappingWin } from '@/lib/fetchAcknowledgedHandicappingWinsNew'

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

    setAcknowledgedKeys(prev => {
      const next = new Set(prev)
      if (isAcked) next.delete(key)
      else next.add(key)
      return next
    })

    try {
      const res = await fetch('/api/handicapping-acknowledge-ecs', {
        method: isAcked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitename: row.sitename, checkdate: cd }),
      })
      if (!res.ok) throw new Error('Request failed')
    } catch {
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

      {(() => {
        const openCount = alerts.filter(r => !acknowledgedKeys.has(rowKey(r.sitename, checkdate ?? ''))).length
        return (
          <div className={`mb-6 rounded-lg border px-5 py-4 flex items-center justify-between flex-wrap gap-3 ${
            openCount > 0
              ? 'bg-rose-950/40 border-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
              : alerts.length > 0
                ? 'bg-emerald-950/20 border-emerald-800/60'
                : 'bg-[#13152a] border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              {openCount > 0 && (
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
                </span>
              )}
              <span className={`text-sm font-bold uppercase tracking-widest ${openCount > 0 ? 'text-rose-300' : alerts.length > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {openCount > 0
                  ? `${openCount} site${openCount !== 1 ? 's' : ''} need review`
                  : alerts.length > 0
                    ? 'All flagged sites acknowledged'
                    : 'No sites flagged'}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Flagged when payout ≥ 100% and net win ≥ $100 · {alerts.length} flagged · {alerts.length - openCount} acknowledged
            </span>
          </div>
        )
      })()}

      <details className="group mb-6 rounded-lg border border-slate-800 bg-[#13152a] px-5 py-3 text-sm text-slate-300">
        <summary className="cursor-pointer select-none font-semibold text-slate-200 list-none flex items-center gap-2">
          <span className="text-slate-500 group-open:rotate-90 transition-transform">▶</span>
          How to read this page
        </summary>
        <div className="mt-3 space-y-3 leading-relaxed">
          <div>
            <p className="font-semibold text-slate-200">What this page checks</p>
            <p>This page looks at manual handicapping play at each site over the last 4 days. Players using manual handicapping are normally expected to win back less than they bet over time, so a site where they're winning more than they bet stands out.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">What the numbers mean</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-semibold">Wager</span>: total money bet.</li>
              <li><span className="font-semibold">Prizes</span>: total money paid out in wins.</li>
              <li><span className="font-semibold">Payout %</span>: prizes divided by wager. 100% means players won back exactly what they bet; above 100% means they came out ahead.</li>
              <li><span className="font-semibold">Net Win</span>: prizes minus wager. Positive means players are up money.</li>
              <li><span className="font-semibold">Plays</span>: number of bets placed.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-200">When a site gets flagged</p>
            <p>A site shows in the <span className="text-rose-400 font-semibold">red section</span> when players are <span className="font-semibold">ahead overall</span> (payout of 100% or more) <span className="font-semibold">and</span> up at least <span className="font-semibold">$100</span>. Small wins on just a few plays are common and usually just luck, so check the number of plays too.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">What to do</p>
            <p>Look into the flagged site, and click <span className="font-semibold">Acknowledge</span> once it's been reviewed. Acknowledged sites turn green and stop counting as an alert on the dashboard.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">How often it updates</p>
            <p>Every 2 hours. The "Updated" time at the top shows the last refresh, and "Lookback" shows where the 4-day window starts.</p>
          </div>
        </div>
      </details>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-rose-400 font-bold text-sm uppercase tracking-widest">
            ⚠ Payout ≥ 100% &amp; Net Win ≥ $100
          </span>
        </div>
        <div className={`bg-[#13152a] border rounded-lg overflow-hidden ${alerts.some(r => !acknowledgedKeys.has(rowKey(r.sitename, checkdate ?? ''))) ? 'border-rose-600' : 'border-rose-900'}`}>
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
                    <tr key={i} className={`border-t border-slate-800 border-l-4 transition-colors ${isAcked ? 'opacity-60 border-l-emerald-600 hover:bg-[#1a1d35]' : 'bg-rose-950/30 border-l-rose-500 hover:bg-rose-950/50'}`}>
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