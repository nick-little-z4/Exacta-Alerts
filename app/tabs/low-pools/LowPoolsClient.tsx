'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PoolRow, LowPoolsData, AcknowledgedPool } from '@/lib/fetchLowPools'
import { RoulettePoolData } from '@/lib/fetchRoulettePool'
import RoulettePoolClient from './RoulettePoolClient'

function rowKey(row: { site: string; mathname: string; denomination: string }) {
  return `${row.site}-${row.mathname}-${row.denomination}`
}

function SeverityBadge({ pct }: { pct: string }) {
  const val = parseFloat(pct)
  if (val < 0.6)
    return (
      <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-900/60 text-rose-300">
        {(val * 100).toFixed(1)}%
      </span>
    )
  return (
    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-amber-900/60 text-amber-300">
      {(val * 100).toFixed(1)}%
    </span>
  )
}

function PageInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#13152a] border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 text-lg">ℹ️</span>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">About Low Pools</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="text-sm text-slate-400 space-y-3">
          <p className="text-slate-500 italic">Information coming soon.</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="text-xs px-4 py-2 rounded border border-slate-600 text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-all">Close</button>
        </div>
      </div>
    </div>
  )
}

function RowInfoModal({
  row, onClose, onSaveNotes,
}: {
  row: PoolRow
  onClose: () => void
  onSaveNotes?: (notes: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editedNotes, setEditedNotes] = useState(row.notes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!onSaveNotes) return
    setSaving(true)
    await onSaveNotes(editedNotes)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13152a] border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 text-lg">ℹ️</span>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Pool Details</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="mb-4 pb-4 border-b border-slate-800">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Pool</div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-medium">{row.site}</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">{row.manufacturerid}</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">{row.mathname}</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">Denom: {row.denomination}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-slate-500 uppercase tracking-widest">Notes</div>
            {onSaveNotes && !editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-sky-500 hover:text-sky-300 transition-colors">
                {row.notes ? 'Edit' : '+ Add notes'}
              </button>
            )}
          </div>
          {editing ? (
            <div>
              <textarea
                value={editedNotes}
                onChange={e => setEditedNotes(e.target.value)}
                rows={4}
                className="w-full bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                placeholder="Add notes about this pool..."
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => { setEditing(false); setEditedNotes(row.notes ?? '') }} disabled={saving} className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="text-xs px-3 py-1.5 rounded border border-sky-600 text-sky-400 bg-sky-950/30 hover:bg-sky-900/40 transition-all disabled:opacity-40 font-semibold">{saving ? 'Saving...' : 'Save Notes'}</button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              {row.notes ? <p>{row.notes}</p> : <p className="text-slate-500 italic">No notes for this pool.</p>}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="text-xs px-4 py-2 rounded border border-slate-600 text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-all">Close</button>
        </div>
      </div>
    </div>
  )
}

function AcknowledgeModal({
  row, initialNotes, onSubmit, onCancel, isLoading,
}: {
  row: PoolRow
  initialNotes?: string
  onSubmit: (notes: string) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-[#13152a] border border-emerald-700/50 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-lg">✅</span>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Acknowledge Pool</h2>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="mb-5 pb-4 border-b border-slate-800">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Pool</div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-medium">{row.site}</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">{row.manufacturerid}</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">{row.mathname}</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">Denom: {row.denomination}</span>
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">
            Notes <span className="text-slate-600 normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Contacted site, refill scheduled for tomorrow..."
            rows={4}
            className="w-full bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={isLoading} className="text-xs px-4 py-2 rounded border border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200 transition-all disabled:opacity-40">Cancel</button>
          <button onClick={() => onSubmit(notes)} disabled={isLoading || !notes.trim()} className="text-xs px-4 py-2 rounded border border-emerald-600 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold">
            {isLoading ? 'Saving...' : 'Acknowledge →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoButton({ onClick, hasNotes }: { onClick: () => void; hasNotes?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={hasNotes ? 'View notes' : 'View details'}
      className={`w-5 h-5 flex items-center justify-center rounded-full border text-xs font-bold transition-all
        ${hasNotes
          ? 'border-sky-400 text-sky-300 bg-sky-950/40 shadow-[0_0_8px_2px_rgba(56,189,248,0.4)] hover:shadow-[0_0_12px_4px_rgba(56,189,248,0.6)]'
          : 'border-slate-700 text-slate-500 hover:border-sky-500 hover:text-sky-400 hover:bg-sky-950/30'
        }`}
    >
      i
    </button>
  )
}

function PoolTable({
  rows, emptyMsg, onReview, loadingKey, acknowledgedKeys, onInfo, notesCache,
}: {
  rows: PoolRow[]
  emptyMsg: string
  onReview?: (row: PoolRow) => void
  loadingKey?: string | null
  acknowledgedKeys?: Set<string>
  onInfo: (row: PoolRow) => void
  notesCache?: Map<string, string>
}) {
  if (rows.length === 0)
    return <p className="text-slate-500 text-sm px-4 py-6">{emptyMsg}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {['Site', 'Manufacturer', 'Math Name', 'Denom', 'Pool Balance', 'Pool %', '', ...(onReview ? [''] : [])].map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = rowKey(row)
            const isLoading = loadingKey === key
            const hasNotes = !!(notesCache?.get(key))
            return (
              <tr key={i} className="border-t border-slate-800 hover:bg-[#1a1d35] transition-colors">
                <td className="px-4 py-2.5 text-slate-200 font-medium">{row.site}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.manufacturerid}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.mathname}</td>
                <td className="px-4 py-2.5 text-slate-400 tabular-nums">{row.denomination}</td>
                <td className="px-4 py-2.5 text-slate-300 tabular-nums">{Number(row.poolbalance).toLocaleString()}</td>
                <td className="px-4 py-2.5"><SeverityBadge pct={row.poolpercentage} /></td>
                <td className="px-4 py-2.5"><InfoButton onClick={() => onInfo(row)} hasNotes={hasNotes} /></td>
                {onReview && (
                  <td className="px-4 py-2.5 text-right">
                    {acknowledgedKeys?.has(key) ? (
                      <span className="text-xs px-3 py-1 rounded border border-emerald-800 text-emerald-600">✅ Acknowledged</span>
                    ) : (
                      <button onClick={() => onReview(row)} disabled={isLoading} className="text-xs px-3 py-1 rounded border border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {isLoading ? 'Saving...' : 'Acknowledge →'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ReviewedTable({
  rows, acknowledgedMeta, onUnreview, loadingKey, onInfo,
}: {
  rows: PoolRow[]
  acknowledgedMeta: AcknowledgedPool[]
  onUnreview: (row: PoolRow) => void
  loadingKey?: string | null
  onInfo: (row: PoolRow) => void
}) {
  if (rows.length === 0)
    return <p className="text-slate-500 text-sm px-4 py-6">No pools acknowledged yet.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {['Site', 'Manufacturer', 'Math Name', 'Denom', 'Pool Balance', 'Pool %', 'Acknowledged', 'Notes', '', ''].map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = rowKey(row)
            const isLoading = loadingKey === key
            const meta = acknowledgedMeta.find(a => rowKey(a) === key)
            const hasNotes = !!meta?.notes
            return (
              <tr key={i} className="border-t border-slate-800 opacity-60 hover:opacity-100 transition-opacity">
                <td className="px-4 py-2.5 text-slate-200 font-medium">{row.site}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.manufacturerid}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.mathname}</td>
                <td className="px-4 py-2.5 text-slate-400 tabular-nums">{row.denomination}</td>
                <td className="px-4 py-2.5 text-slate-300 tabular-nums">{Number(row.poolbalance).toLocaleString()}</td>
                <td className="px-4 py-2.5"><SeverityBadge pct={row.poolpercentage} /></td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{meta?.acknowledged_at ? new Date(meta.acknowledged_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-2.5 text-xs text-slate-400 max-w-[200px]">
                  {meta?.notes
                    ? <span className="truncate block" title={meta.notes}>{meta.notes}</span>
                    : <span className="text-slate-600 italic">No notes</span>
                  }
                </td>
                <td className="px-4 py-2.5"><InfoButton onClick={() => onInfo(row)} hasNotes={hasNotes} /></td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => onUnreview(row)} disabled={isLoading} className="text-xs px-3 py-1 rounded border border-slate-700 text-slate-500 hover:border-rose-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {isLoading ? 'Removing...' : 'Undo'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type ViewMode = 'pools' | 'roulette'

export default function LowPoolsClient({
  data,
  rouletteData,
}: {
  data: LowPoolsData
  rouletteData: RoulettePoolData | null
}) {
  const router = useRouter()

  const criticals = data?.criticals ?? []
  const warnings = data?.warnings ?? []
  const newEntries = data?.new_entries ?? []
  const newCriticals = data?.new_criticals ?? []

  const [view, setView] = useState<ViewMode>('pools')
  const [acknowledgedKeys, setAcknowledgedKeys] = useState<Set<string>>(
    () => new Set((data?.acknowledged ?? []).map(rowKey))
  )
  const [acknowledgedMeta, setAcknowledgedMeta] = useState<AcknowledgedPool[]>(data?.acknowledged ?? [])
  const [notesCache, setNotesCache] = useState<Map<string, string>>(
    () => new Map((data?.acknowledged ?? []).filter(a => a.notes).map(a => [rowKey(a), a.notes!]))
  )
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [showPageInfo, setShowPageInfo] = useState(false)
  const [infoRow, setInfoRow] = useState<PoolRow | null>(null)
  const [pendingRow, setPendingRow] = useState<PoolRow | null>(null)

  useEffect(() => {
    setLastRefresh(new Date())
    const interval = setInterval(() => { router.refresh(); setLastRefresh(new Date()) }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [router])

  const activeCriticals = criticals.filter(r => !acknowledgedKeys.has(rowKey(r)))
  const reviewedRows = acknowledgedMeta.map(a => ({
    site: a.site,
    manufacturerid: '',
    mathname: a.mathname,
    denomination: a.denomination,
    poolbalance: '0',
    poolpercentage: '0',
    ...criticals.find(c => rowKey(c) === rowKey(a)),
    ...newCriticals.find(c => rowKey(c) === rowKey(a)),
    notes: a.notes,
  })) as PoolRow[]

  const handleReview = async (row: PoolRow, notes: string) => {
    const key = rowKey(row)
    setLoadingKey(key)
    setError(null)
    setPendingRow(null)
    const resolvedNotes = notes || notesCache.get(key) || undefined
    setAcknowledgedKeys(prev => new Set([...prev, key]))
    setAcknowledgedMeta(prev => [...prev, { site: row.site, mathname: row.mathname, denomination: row.denomination, acknowledged_at: new Date().toISOString(), acknowledged_by: 'staff', notes: resolvedNotes }])
    if (resolvedNotes) setNotesCache(prev => new Map(prev).set(key, resolvedNotes))
    try {
      const res = await fetch('/api/acknowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site: row.site, mathname: row.mathname, denomination: row.denomination, notes: notes || null }) })
      if (!res.ok) throw new Error('Failed to acknowledge')
    } catch {
      setAcknowledgedKeys(prev => { const next = new Set(prev); next.delete(key); return next })
      setAcknowledgedMeta(prev => prev.filter(a => rowKey(a) !== key))
      setError('Failed to save acknowledgement. Please try again.')
    } finally { setLoadingKey(null) }
  }

  const handleUnreview = async (row: PoolRow) => {
    const key = rowKey(row)
    setLoadingKey(key)
    setError(null)
    setAcknowledgedKeys(prev => { const next = new Set(prev); next.delete(key); return next })
    setAcknowledgedMeta(prev => prev.filter(a => rowKey(a) !== key))
    try {
      const res = await fetch('/api/acknowledge', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site: row.site, mathname: row.mathname, denomination: row.denomination }) })
      if (!res.ok) throw new Error('Failed to remove acknowledgement')
    } catch {
      setAcknowledgedKeys(prev => new Set([...prev, key]))
      setAcknowledgedMeta(prev => [...prev, { site: row.site, mathname: row.mathname, denomination: row.denomination }])
      setError('Failed to remove acknowledgement. Please try again.')
    } finally { setLoadingKey(null) }
  }

  const handleSaveNotes = async (row: PoolRow, notes: string) => {
    const key = rowKey(row)
    setAcknowledgedMeta(prev => prev.map(a => rowKey(a) === key ? { ...a, notes: notes || undefined } : a))
    setNotesCache(prev => { const next = new Map(prev); if (notes) next.set(key, notes); else next.delete(key); return next })
    setInfoRow(prev => prev ? { ...prev, notes: notes || undefined } : null)
    await fetch('/api/acknowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site: row.site, mathname: row.mathname, denomination: row.denomination, notes: notes || null }) })
  }

  const isAcknowledged = (row: PoolRow) => acknowledgedKeys.has(rowKey(row))

  const statCards = [
    { label: 'Critical Pools', value: activeCriticals.length, sub: 'Under 60%', color: 'text-rose-400', border: 'border-rose-900/50' },
    { label: 'New Criticals', value: newCriticals.length, sub: 'First time today', color: 'text-orange-400', border: 'border-orange-900/50' },
    { label: 'Reviewed', value: reviewedRows.length, sub: 'Acknowledged', color: 'text-emerald-400', border: 'border-emerald-900/50' },
    { label: 'Watchlist', value: warnings.length, sub: '60% – 70%', color: 'text-amber-400', border: 'border-amber-900/50' },
    { label: 'New Today', value: newEntries.length, sub: 'First seen today', color: 'text-sky-400', border: 'border-sky-900/50' },
  ]

  return (
    <>
      {showPageInfo && <PageInfoModal onClose={() => setShowPageInfo(false)} />}
      {infoRow && (
        <RowInfoModal
          row={infoRow}
          onClose={() => setInfoRow(null)}
          onSaveNotes={isAcknowledged(infoRow) ? (notes) => handleSaveNotes(infoRow, notes) : undefined}
        />
      )}
      {pendingRow && (
        <AcknowledgeModal
          row={pendingRow}
          initialNotes={notesCache.get(rowKey(pendingRow))}
          onSubmit={(notes) => handleReview(pendingRow, notes)}
          onCancel={() => setPendingRow(null)}
          isLoading={loadingKey === rowKey(pendingRow)}
        />
      )}

      {error && (
        <div className="mb-6 px-4 py-3 bg-rose-950 border border-rose-700 rounded-lg text-rose-300 text-sm">{error}</div>
      )}

      {/* Top bar: view toggle + info button */}
      <div className="flex items-center justify-between mb-6">
        {/* Toggle */}
        <div className="flex items-center bg-[#13152a] border border-slate-700 rounded-lg p-1 gap-1">
          <button
            onClick={() => setView('pools')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'pools'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pool Monitor
          </button>
          <button
            onClick={() => setView('roulette')}
            // disabled={!rouletteData}
            disabled={true}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'roulette'
                ? 'bg-violet-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed'
            }`}
          >
            Roulette Graph
          </button>
        </div>

        <button
          onClick={() => setShowPageInfo(true)}
          title="About this page"
          className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-700 text-slate-500 hover:border-sky-500 hover:text-sky-400 hover:bg-sky-950/30 transition-all text-sm font-bold"
        >
          i
        </button>
      </div>

      {/* Roulette view */}
      {view === 'roulette' && rouletteData && (
        <RoulettePoolClient data={rouletteData} />
      )}

      {/* Pool monitor view */}
      {view === 'pools' && (
        <>
          <div className="grid grid-cols-5 gap-4 mb-10">
            {statCards.map(card => (
              <div key={card.label} className={`bg-[#13152a] border ${card.border} rounded-lg p-5`}>
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{card.label}</div>
                <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-8">
            {newCriticals.length > -1 && (
              <div className="bg-[#13152a] border border-orange-700/50 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                  <span>🚨</span>
                  <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">New Critical Today</h2>
                  <span className="ml-auto text-xs text-slate-500">{newCriticals.length} pool{newCriticals.length !== 1 ? 's' : ''}</span>
                </div>
                <PoolTable rows={newCriticals} emptyMsg="No new critical pools today." onReview={setPendingRow} loadingKey={loadingKey} acknowledgedKeys={acknowledgedKeys} onInfo={setInfoRow} notesCache={notesCache} />
              </div>
            )}

            <div className="bg-[#13152a] border border-rose-700/50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <span>🔴</span>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Critical Pools</h2>
                <span className="ml-auto text-xs text-slate-500">{activeCriticals.length} pool{activeCriticals.length !== 1 ? 's' : ''}</span>
              </div>
              <PoolTable rows={activeCriticals} emptyMsg="No critical pools right now." onReview={setPendingRow} loadingKey={loadingKey} onInfo={setInfoRow} notesCache={notesCache} />
            </div>

            <div className="bg-[#13152a] border border-emerald-700/50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <span>✅</span>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Reviewed Pools</h2>
                <span className="ml-auto text-xs text-slate-500">{reviewedRows.length} pool{reviewedRows.length !== 1 ? 's' : ''}</span>
              </div>
              <ReviewedTable rows={reviewedRows} acknowledgedMeta={acknowledgedMeta} onUnreview={handleUnreview} loadingKey={loadingKey} onInfo={setInfoRow} />
            </div>

            <div className="bg-[#13152a] border border-amber-700/50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <span>🟡</span>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Watchlist</h2>
                <span className="ml-auto text-xs text-slate-500">{warnings.length} pool{warnings.length !== 1 ? 's' : ''}</span>
              </div>
              <PoolTable rows={warnings} emptyMsg="No warning pool list pools right now." onInfo={setInfoRow} notesCache={notesCache} />
            </div>

            <div className="bg-[#13152a] border border-sky-700/50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <span>🆕</span>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">New Entries Today</h2>
                <span className="ml-auto text-xs text-slate-500">{newEntries.length} pool{newEntries.length !== 1 ? 's' : ''}</span>
              </div>
              <PoolTable rows={newEntries} emptyMsg="No new pool entries today." onInfo={setInfoRow} notesCache={notesCache} />
            </div>
          </div>
        </>
      )}

      <footer className="mt-12 text-center text-xs text-slate-600">
        Exacta Alerts · Low Pools · {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
      </footer>
    </>
  )
}