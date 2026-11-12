'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NPrizesData, NPrizesRow } from '@/lib/fetchNPrizes'
import { AcknowledgedNPrize, nPrizesAckKey } from '@/lib/fetchNPrizesAcknowledged'

function formatCurrency(val: number): string {
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function formatDenom(val: number): string {
  const dollars = val / 100
  if (dollars >= 1) return `$${dollars.toFixed(0)}`
  return `$${dollars.toFixed(2)}`
}

function formatToCDT(utcTimestamp: string): string {
  const date = new Date(utcTimestamp + 'Z') // treat as UTC
  return date.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }) + ' CDT'
}

export default function NPrizesClient({
  data,
  acknowledged: initialAcknowledged,
}: {
  data: NPrizesData
  acknowledged: AcknowledgedNPrize[]
}) {
  const router = useRouter()
  const rows: NPrizesRow[] = data?.data ?? []
  const timestamp = data?.timestamp ?? null

  const [ackKeys, setAckKeys] = useState<Set<string>>(
    () => new Set(initialAcknowledged.filter(a => a.is_acknowledged !== false).map(a => a.ack_key))
  )
  const [notes, setNotes] = useState<Record<string, string>>(
    () => Object.fromEntries(initialAcknowledged.filter(a => a.notes).map(a => [a.ack_key, a.notes as string]))
  )
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>(() => ({ ...notes }))
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const payloadFor = (row: NPrizesRow) => ({
    ack_key: nPrizesAckKey(row),
    sitename: row.sitename,
    mathname: row.mathname,
    denom: row.denom,
    num_prizes: row.num_prizes,
  })

  const toggleAck = async (row: NPrizesRow) => {
    const key = nPrizesAckKey(row)
    const wasAcked = ackKeys.has(key)
    setLoadingKey(key)
    setError(null)
    setAckKeys(prev => {
      const next = new Set(prev)
      if (wasAcked) next.delete(key)
      else next.add(key)
      return next
    })
    try {
      const res = await fetch('/api/acknowledge-n-prizes', {
        method: wasAcked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadFor(row)),
      })
      if (!res.ok) throw new Error('Failed to update acknowledgement')
      router.refresh()
    } catch {
      setAckKeys(prev => {
        const next = new Set(prev)
        if (wasAcked) next.add(key)
        else next.delete(key)
        return next
      })
      setError('Failed to save. Please try again.')
    } finally {
      setLoadingKey(null)
    }
  }

  const saveNote = async (row: NPrizesRow) => {
    const key = nPrizesAckKey(row)
    const value = (notes[key] ?? '').trim()
    if (value === (savedNotes[key] ?? '')) return
    setError(null)
    try {
      const res = await fetch('/api/acknowledge-n-prizes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payloadFor(row), notes: value }),
      })
      if (!res.ok) throw new Error('Failed to save note')
      setSavedNotes(prev => ({ ...prev, [key]: value }))
    } catch {
      setError('Failed to save note. Please try again.')
    }
  }

  // Home page alert threshold: rows at or above this count trigger the dashboard badge
  const ALERT_THRESHOLD = 10
  const multiPrizeCount = rows.filter(r => r.num_prizes >= 6).length
  const alertCount = rows.filter(r => r.num_prizes >= ALERT_THRESHOLD && !ackKeys.has(nPrizesAckKey(r))).length
  const acknowledgedAlertCount = rows.filter(r => r.num_prizes >= ALERT_THRESHOLD && ackKeys.has(nPrizesAckKey(r))).length
  const sorted = [...rows]
    .sort((a, b) => b.num_prizes - a.num_prizes || b.first_exceeding_row - a.first_exceeding_row)

  const tier = (n: number) => (n >= ALERT_THRESHOLD ? 'alert' : n >= 6 ? 'watch' : 'normal')

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        {timestamp && (
          <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 w-fit ml-auto">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Updated</span>
            <span className="text-slate-200 text-xs font-semibold">{formatToCDT(timestamp)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#13152a] border border-amber-900/50 rounded-lg p-5">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Entries</div>
          <div className="text-3xl font-bold text-amber-400">{rows.length}</div>
          <div className="text-xs text-slate-500 mt-1">Games flagged</div>
        </div>
        <div className="bg-[#13152a] border border-rose-900/50 rounded-lg p-5">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Multi-Prize</div>
          <div className="text-3xl font-bold text-rose-400">{multiPrizeCount}</div>
          <div className="text-xs text-slate-500 mt-1">6+ prizes to exceed net</div>
        </div>
        <div className={`bg-[#13152a] border rounded-lg p-5 ${alertCount > 0 ? 'border-rose-600 shadow-[0_0_18px_rgba(244,63,94,0.2)]' : 'border-slate-800'}`}>
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Alerting</div>
          <div className={`text-3xl font-bold ${alertCount > 0 ? 'text-rose-400' : 'text-white'}`}>{alertCount}</div>
          <div className="text-xs text-slate-500 mt-1">
            {ALERT_THRESHOLD}+ prizes, not yet acknowledged
            {acknowledgedAlertCount > 0 && <span className="text-emerald-400"> ({acknowledgedAlertCount} acknowledged)</span>}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-rose-950 border border-rose-700 rounded-lg text-rose-300 text-sm">
          {error}
        </div>
      )}

      <details className="group mb-6 rounded-lg border border-slate-800 bg-[#13152a] px-5 py-3 text-sm text-slate-300">
        <summary className="cursor-pointer select-none font-semibold text-slate-200 list-none flex items-center gap-2">
          <span className="text-slate-500 group-open:rotate-90 transition-transform">▶</span>
          How to read this page
        </summary>
        <div className="mt-3 space-y-3 leading-relaxed">
          <div>
            <p className="font-semibold text-slate-200">What this page checks</p>
            <p>Over the last 8 days, this page finds games where players came out more than <span className="font-semibold">$5,000</span> ahead. For each one, it asks: how many of the game's biggest wins did it take to add up to that amount?</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">Why that matters</p>
            <p>Normally, a big net payout comes from <span className="font-semibold">one or two large wins</span>, like a jackpot. If it took <span className="font-semibold">many</span> wins to get there, the game may be paying out more often than it should, which can point to a game or math issue.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">What the columns mean</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-semibold">Net Prizes</span>: total won minus total bet on that game at that site over the 8 days.</li>
              <li><span className="font-semibold"># Prizes</span>: how many of the largest wins it took to reach the Net Prizes amount. Lower is normal; higher is unusual.</li>
              <li><span className="font-semibold">Top Prizes</span>: those largest wins, biggest first.</li>
              <li><span className="font-semibold">Denom</span>: the bet size the game is played at.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-200">What the colors mean</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-amber-400 font-semibold">Watch</span> (6 to {ALERT_THRESHOLD - 1} prizes): unusual, worth a look.</li>
              <li><span className="text-rose-400 font-semibold">Alert</span> ({ALERT_THRESHOLD}+ prizes): shows on the dashboard and should be reviewed.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-200">Acknowledging</p>
            <p>Once an alert has been reviewed, click the circle in the <span className="font-semibold">Ack</span> column to clear it from the dashboard badge. Add a note to say what you found. If the same game has a new big payout later, it shows up again as a new alert.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200">How often it updates</p>
            <p>Once a day, in the morning. The "Updated" time at the top shows the last refresh.</p>
          </div>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-600/40 border-l-4 border-rose-500" />Alert: {ALERT_THRESHOLD}+ prizes (triggers dashboard badge)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500/20 border-l-4 border-amber-500" />Watch: 6 to {ALERT_THRESHOLD - 1} prizes</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#13152a] text-slate-400 text-xs uppercase tracking-widest">
              <th className="px-4 py-3 text-left">Math Name</th>
              <th className="px-4 py-3 text-right">Denom</th>
              <th className="px-4 py-3 text-left">Site</th>
              <th className="px-4 py-3 text-right">
                <span className="inline-flex items-center gap-1 justify-end">
                  Net Prizes
                  <span className="relative group cursor-help">
                    <span className="text-slate-600 hover:text-slate-400 text-xs border border-slate-700 rounded-full w-4 h-4 inline-flex items-center justify-center">?</span>
                    <span className="absolute top-full left-0 mt-2 w-64 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
                      Sum of prizes minus sum of wagers over the 8-day rolling window for this math name, denom, and site combination.
                    </span>
                  </span>
                </span>
              </th>
              <th className="px-4 py-3 text-right"># Prizes</th>
              <th className="px-4 py-3 text-left">Top Prizes</th>
              <th className="px-4 py-3 text-right">First Exceeding Row</th>
              <th className="px-4 py-3 text-left">Notes</th>
              <th className="px-4 py-3 text-center">Ack</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const key = nPrizesAckKey(row)
              const isAcked = ackKeys.has(key)
              const isLoading = loadingKey === key
              return (
              <tr key={`${key}-${i}`} className={`border-t border-slate-800 transition-colors border-l-4 ${
                isAcked ? 'bg-emerald-950/10 border-l-emerald-600 opacity-70 hover:opacity-100' :
                tier(row.num_prizes) === 'alert' ? 'bg-rose-950/40 border-l-rose-500 hover:bg-rose-950/60' :
                tier(row.num_prizes) === 'watch' ? 'bg-amber-950/20 border-l-amber-500 hover:bg-amber-950/30' :
                'border-l-transparent hover:bg-[#13152a]'
              }`}>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">{row.mathname}</td>
                <td className="px-4 py-3 text-right text-slate-300">{formatDenom(row.denom)}</td>
                <td className="px-4 py-3 font-semibold text-orange-400">{row.sitename}</td>
                <td className="px-4 py-3 text-right text-rose-400 font-semibold">{formatCurrency(row.netprizes)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    tier(row.num_prizes) === 'alert' ? 'bg-rose-600 text-white' :
                    tier(row.num_prizes) === 'watch' ? 'bg-amber-900/60 text-amber-300' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {tier(row.num_prizes) === 'alert' ? '⚠ ' : ''}{row.num_prizes}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{row.top_prizes}</td>
                <td className="px-4 py-3 text-right text-slate-400">{row.first_exceeding_row}</td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={notes[key] ?? ''}
                    onChange={e => setNotes(prev => ({ ...prev, [key]: e.target.value }))}
                    onBlur={() => saveNote(row)}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    placeholder="Add note"
                    className="w-48 bg-transparent border border-slate-800 focus:border-slate-600 rounded px-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 outline-none"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleAck(row)}
                    disabled={isLoading}
                    title={isAcked ? 'Click to unacknowledge' : 'Click to acknowledge'}
                    className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      isAcked
                        ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 hover:bg-rose-950/20 hover:border-rose-500 hover:text-rose-400'
                        : 'border border-slate-600 text-slate-600 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20'
                    }`}
                  >
                    <span className="text-xs">{isLoading ? '…' : isAcked ? '✓' : '○'}</span>
                  </button>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}