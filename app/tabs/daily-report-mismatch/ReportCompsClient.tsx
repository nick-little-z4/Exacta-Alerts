'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReportCompRow, AcknowledgedReportComp } from '@/lib/fetchReportComps'

function fmtHandle(val: number | null) {
  if (val === null) return '-'
  return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtVariance(val: number | null) {
  if (val === null) return <span className="text-slate-600">-</span>
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
    () => new Set(initialAcknowledged.filter(a => a.is_acknowledged !== false).map(a => a.ack_row_id))
  )
  const [notesMap, setNotesMap] = useState<Record<string, { notes: string; updatedAt?: string | null; updatedBy?: string | null }>>(
    () => Object.fromEntries(
      initialAcknowledged
        .filter(a => a.notes)
        .map(a => [a.ack_row_id, { notes: a.notes ?? '', updatedAt: a.notes_updated_at, updatedBy: a.notes_updated_by }])
    )
  )
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const startEdit = (key: string) => {
    setEditingKey(key)
    setDraft(notesMap[key]?.notes ?? '')
  }

  const saveNotes = async (key: string) => {
    const previous = notesMap[key]
    const text = draft.trim()
    setSavingKey(key)
    setError(null)
    setNotesMap(prev => {
      const next = { ...prev }
      if (text) next[key] = { notes: text, updatedAt: new Date().toISOString(), updatedBy: 'staff' }
      else delete next[key]
      return next
    })
    setEditingKey(null)

    try {
      const res = await fetch('/api/acknowledge-report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ack_row_id: key, notes: text || null }),
      })
      if (!res.ok) throw new Error('Failed to save notes')
    } catch {
      setNotesMap(prev => {
        const next = { ...prev }
        if (previous) next[key] = previous
        else delete next[key]
        return next
      })
      setError('Failed to save notes. Please try again.')
    } finally {
      setSavingKey(null)
    }
  }
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
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">DW Handle</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sys Handle</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Handle Variance</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ack</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500 text-sm">
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
                    <td className="text-right px-4 py-2.5 tabular-nums text-slate-300">{fmtHandle(row.dwHandle)}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums text-slate-300">{fmtHandle(row.sysHandle)}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">
                      {fmtVariance(row.handleVariance)}
                    </td>
                    <td className="px-4 py-2.5 align-top min-w-[220px]">
                      {editingKey === row.ackRowId ? (
                        <div className="flex flex-col gap-1.5">
                          <textarea
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            rows={2}
                            autoFocus
                            placeholder="Add a note for the team..."
                            className="w-full bg-[#0a0b14] border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-600"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveNotes(row.ackRowId)}
                              className="text-xs px-2 py-0.5 rounded bg-sky-600 text-white hover:bg-sky-500"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="text-xs px-2 py-0.5 rounded border border-slate-600 text-slate-400 hover:text-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(row.ackRowId)}
                          disabled={savingKey === row.ackRowId}
                          title={
                            notesMap[row.ackRowId]?.updatedAt
                              ? `Last updated ${new Date(notesMap[row.ackRowId]!.updatedAt!).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CDT by ${notesMap[row.ackRowId]?.updatedBy ?? 'staff'}`
                              : 'Click to add a note'
                          }
                          className="text-left text-xs w-full disabled:opacity-40"
                        >
                          {notesMap[row.ackRowId]?.notes ? (
                            <span className="text-slate-300 whitespace-pre-wrap">{notesMap[row.ackRowId]!.notes}</span>
                          ) : (
                            <span className="text-slate-600 hover:text-slate-400">+ Add note</span>
                          )}
                        </button>
                      )}
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