'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PoolRow, LowPoolsData, AcknowledgedPool } from '@/lib/fetchLowPools'

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

function PoolTable({
  rows,
  emptyMsg,
  onReview,
  loadingKey,
  acknowledgedKeys,
}: {
  rows: PoolRow[]
  emptyMsg: string
  onReview?: (row: PoolRow) => void
  loadingKey?: string | null
  acknowledgedKeys?: Set<string>
}) {
  if (rows.length === 0)
    return <p className="text-slate-500 text-sm px-4 py-6">{emptyMsg}</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {['Site', 'Manufacturer', 'Math Name', 'Denom', 'Pool Balance', 'Pool %', ...(onReview ? [''] : [])].map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = rowKey(row)
            const isLoading = loadingKey === key
            return (
              <tr key={i} className="border-t border-slate-800 hover:bg-[#1a1d35] transition-colors">
                <td className="px-4 py-2.5 text-slate-200 font-medium">{row.site}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.manufacturerid}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.mathname}</td>
                <td className="px-4 py-2.5 text-slate-400 tabular-nums">{row.denomination}</td>
                <td className="px-4 py-2.5 text-slate-300 tabular-nums">
                  {Number(row.poolbalance).toLocaleString()}
                </td>
                <td className="px-4 py-2.5">
                  <SeverityBadge pct={row.poolpercentage} />
                </td>
              {onReview && (
                <td className="px-4 py-2.5 text-right">
                  {acknowledgedKeys?.has(rowKey(row)) ? (
                    <span className="text-xs px-3 py-1 rounded border border-emerald-800 text-emerald-600">
                      ✅ Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => onReview(row)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1 rounded border border-slate-600 text-slate-400 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
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
  rows,
  acknowledgedMeta,
  onUnreview,
  loadingKey,
}: {
  rows: PoolRow[]
  acknowledgedMeta: AcknowledgedPool[]
  onUnreview: (row: PoolRow) => void
  loadingKey?: string | null
}) {
  if (rows.length === 0)
    return <p className="text-slate-500 text-sm px-4 py-6">No pools acknowledged yet.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {['Site', 'Manufacturer', 'Math Name', 'Denom', 'Pool Balance', 'Pool %', 'Acknowledged', ''].map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = rowKey(row)
            const isLoading = loadingKey === key
            const meta = acknowledgedMeta.find(a => rowKey(a) === key)
            return (
              <tr key={i} className="border-t border-slate-800 opacity-60 hover:opacity-100 transition-opacity">
                <td className="px-4 py-2.5 text-slate-200 font-medium">{row.site}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.manufacturerid}</td>
                <td className="px-4 py-2.5 text-slate-300">{row.mathname}</td>
                <td className="px-4 py-2.5 text-slate-400 tabular-nums">{row.denomination}</td>
                <td className="px-4 py-2.5 text-slate-300 tabular-nums">
                  {Number(row.poolbalance).toLocaleString()}
                </td>
                <td className="px-4 py-2.5">
                  <SeverityBadge pct={row.poolpercentage} />
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {meta?.acknowledged_at
                    ? new Date(meta.acknowledged_at).toLocaleString()
                    : '—'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => onUnreview(row)}
                    disabled={isLoading}
                    className="text-xs px-3 py-1 rounded border border-slate-700 text-slate-500 hover:border-rose-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
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

export default function LowPoolsClient({ data }: { data: LowPoolsData }) {
  const router = useRouter()

  const criticals = data?.criticals ?? []
  const warnings = data?.warnings ?? []
  const newEntries = data?.new_entries ?? []
  const newCriticals = data?.new_criticals ?? []

  const [acknowledgedKeys, setAcknowledgedKeys] = useState<Set<string>>(
    () => new Set((data?.acknowledged ?? []).map(rowKey))
  )
  const [acknowledgedMeta, setAcknowledgedMeta] = useState<AcknowledgedPool[]>(
    data?.acknowledged ?? []
  )
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

useEffect(() => {
  setLastRefresh(new Date()) // set initial value client-side only

  const interval = setInterval(() => {
    router.refresh()
    setLastRefresh(new Date())
  }, 5 * 60 * 1000)

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
})) as PoolRow[]

  const handleReview = async (row: PoolRow) => {
    const key = rowKey(row)
    setLoadingKey(key)
    setError(null)

    setAcknowledgedKeys(prev => new Set([...prev, key]))
    setAcknowledgedMeta(prev => [...prev, {
      site: row.site,
      mathname: row.mathname,
      denomination: row.denomination,
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: 'staff',
    }])

    try {
      const res = await fetch('/api/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: row.site,
          mathname: row.mathname,
          denomination: row.denomination,
        }),
      })
      if (!res.ok) throw new Error('Failed to acknowledge')
    } catch (err) {
      setAcknowledgedKeys(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      setAcknowledgedMeta(prev => prev.filter(a => rowKey(a) !== key))
      setError('Failed to save acknowledgement. Please try again.')
    } finally {
      setLoadingKey(null)
    }
  }

  const handleUnreview = async (row: PoolRow) => {
    const key = rowKey(row)
    setLoadingKey(key)
    setError(null)

    setAcknowledgedKeys(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    setAcknowledgedMeta(prev => prev.filter(a => rowKey(a) !== key))

    try {
      const res = await fetch('/api/acknowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: row.site,
          mathname: row.mathname,
          denomination: row.denomination,
        }),
      })
      if (!res.ok) throw new Error('Failed to remove acknowledgement')
    } catch (err) {
      setAcknowledgedKeys(prev => new Set([...prev, key]))
      setAcknowledgedMeta(prev => [...prev, {
        site: row.site,
        mathname: row.mathname,
        denomination: row.denomination,
      }])
      setError('Failed to remove acknowledgement. Please try again.')
    } finally {
      setLoadingKey(null)
    }
  }

  const statCards = [
    {
      label: 'Critical Pools',
      value: activeCriticals.length,
      sub: 'Under 60%',
      color: 'text-rose-400',
      border: 'border-rose-900/50',
    },
    {
      label: 'New Criticals',
      value: newCriticals.length,
      sub: 'First time today',
      color: 'text-orange-400',
      border: 'border-orange-900/50',
    },
    {
      label: 'Reviewed',
      value: reviewedRows.length,
      sub: 'Acknowledged',
      color: 'text-emerald-400',
      border: 'border-emerald-900/50',
    },
    {
      label: 'Watchlist',
      value: warnings.length,
      sub: '60% – 70%',
      color: 'text-amber-400',
      border: 'border-amber-900/50',
    },
    {
      label: 'New Today',
      value: newEntries.length,
      sub: 'First seen today',
      color: 'text-sky-400',
      border: 'border-sky-900/50',
    },
  ]

  return (
    <>
      {error && (
        <div className="mb-6 px-4 py-3 bg-rose-950 border border-rose-700 rounded-lg text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards */}
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

        {/* New Critical Pools */}
        {newCriticals.length > -1 && (
          <div className="bg-[#13152a] border border-orange-700/50 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              <span>🚨</span>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">New Critical Today</h2>
              <span className="ml-auto text-xs text-slate-500">
                {newCriticals.length} pool{newCriticals.length !== 1 ? 's' : ''}
              </span>
            </div>
            <PoolTable
              rows={newCriticals}
              emptyMsg="No new critical pools today."
              onReview={handleReview}
              loadingKey={loadingKey}
              acknowledgedKeys={acknowledgedKeys}
            />
          </div>
        )}

        {/* Critical Pools */}
        <div className="bg-[#13152a] border border-rose-700/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <span>🔴</span>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Critical Pools</h2>
            <span className="ml-auto text-xs text-slate-500">
              {activeCriticals.length} pool{activeCriticals.length !== 1 ? 's' : ''}
            </span>
          </div>
          <PoolTable
            rows={activeCriticals}
            emptyMsg="No critical pools right now."
            onReview={handleReview}
            loadingKey={loadingKey}
          />
        </div>

        {/* Reviewed Pools */}
        <div className="bg-[#13152a] border border-emerald-700/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <span>✅</span>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Reviewed Pools</h2>
            <span className="ml-auto text-xs text-slate-500">
              {reviewedRows.length} pool{reviewedRows.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ReviewedTable
            rows={reviewedRows}
            acknowledgedMeta={acknowledgedMeta}
            onUnreview={handleUnreview}
            loadingKey={loadingKey}
          />
        </div>

        {/* Watchlist */}
        <div className="bg-[#13152a] border border-amber-700/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <span>🟡</span>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Watchlist</h2>
            <span className="ml-auto text-xs text-slate-500">
              {warnings.length} pool{warnings.length !== 1 ? 's' : ''}
            </span>
          </div>
          <PoolTable rows={warnings} emptyMsg="No warning pool list pools right now." />
        </div>

        {/* New Today */}
        <div className="bg-[#13152a] border border-sky-700/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <span>🆕</span>
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">New Entries Today</h2>
            <span className="ml-auto text-xs text-slate-500">
              {newEntries.length} pool{newEntries.length !== 1 ? 's' : ''}
            </span>
          </div>
          <PoolTable rows={newEntries} emptyMsg="No new pool entries today." />
        </div>
      </div>

      <footer className="mt-12 text-center text-xs text-slate-600">
        Exacta Alerts · Low Pools · {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
      </footer>
    </>
  )
}