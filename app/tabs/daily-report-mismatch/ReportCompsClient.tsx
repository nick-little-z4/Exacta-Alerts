'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReportCompRow, AcknowledgedReportComp } from '@/lib/fetchReportComps'

function fmtVariance(val: number | null) {
  if (val === null) return <span className="text-slate-600">—</span>
  const formatted = `$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (val > 0) return <span className="text-rose-400 font-semibold">{formatted}</span>
  if (val < 0) return <span className="text-emerald-400 font-semibold">-{formatted}</span>
  return <span className="text-slate-400">$0.00</span>
}

export default function ReportCompsClient({
  rows,
  acknowledged: initialAcknowledged,
}: {
  rows: ReportCompRow[]
  acknowledged: AcknowledgedReportComp[]
}) {
  const router = useRouter()
  const [acknowledgedKeys, setAcknowledgedKeys] = useState<Set<string>>(
    () => new Set(initialAcknowledged.map(a => a.ack_row_id))
  )
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAcknowledge = async (row: ReportCompRow) => {
    const key = row.ackRowId
    const isAcknowledged = acknowledgedKeys.has(key)
    setLoadingKey(key)
    setError(null)

    // Optimistic update
    setAcknowledgedKeys(prev => {
      const next = new Set(prev)
      if (isAcknowledged) next.delete(key)
      else next.add(key)
      return next
    })

    try {
      const res = await fetch('/api/acknowledge-report', {
        method: isAcknowledged ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ack_row_id: key }),
      })
      if (!res.ok) throw new Error('Failed to update acknowledgement')
      router.refresh() // re-fetch server data so stat cards update
    } catch (err) {
      // Rollback on failure
      setAcknowledgedKeys(prev => {
        const next = new Set(prev)
        if (isAcknowledged) next.add(key)
        else next.delete(key)
        return next
      })
      setError('Failed to save. Please try again.')
    } finally {
      setLoadingKey(null)
    }
  }

  const displayRows = rows.filter(r => r.handleVariance !== null && r.handleVariance !== 0)

  return (
    <>
      {error && (
        <div className="mb-6 px-4 py-3 bg-rose-950 border border-rose-700 rounded-lg text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#13152a] border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Market</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Enterprise</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">System</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Game Type</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Handle Variance</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ack</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                  No mismatches found.
                </td>
              </tr>
            ) : (
              displayRows.map((row, i) => {
                const isAcknowledged = acknowledgedKeys.has(row.ackRowId)
                const isLoading = loadingKey === row.ackRowId

                return (
                  <tr
                    key={`${row.ackRowId}-${i}`}
                    className={`border-t border-slate-800 hover:bg-[#1a1d35] transition-colors ${
                      isAcknowledged ? 'bg-emerald-950/10' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-orange-400 font-semibold text-xs">{row.date}</td>
                    <td className="px-4 py-2.5 text-slate-300">{row.market}</td>
                    <td className="px-4 py-2.5 text-slate-300">{row.enterprise}</td>
                    <td className="px-4 py-2.5 text-slate-200">{row.system}</td>
                    <td className="px-4 py-2.5 text-slate-400">{row.gameType}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">
                      {fmtVariance(row.handleVariance)}
                    </td>
                    <td className="text-center px-4 py-2.5">
                      <button
                        onClick={() => handleAcknowledge(row)}
                        disabled={isLoading}
                        title={isAcknowledged ? 'Click to unacknowledge' : 'Click to acknowledge'}
                        className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          isAcknowledged
                            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 hover:bg-rose-950/20 hover:border-rose-500 hover:text-rose-400'
                            : 'border border-slate-600 text-slate-600 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20'
                        }`}
                      >
                        {isLoading ? (
                          <span className="text-xs">…</span>
                        ) : isAcknowledged ? (
                          <span className="text-xs">✓</span>
                        ) : (
                          <span className="text-xs">○</span>
                        )}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}