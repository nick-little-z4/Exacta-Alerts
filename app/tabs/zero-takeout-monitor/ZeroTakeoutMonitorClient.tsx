'use client'

import { useState } from 'react'
import { ZeroTakeoutData, ZeroTakeoutRow } from '@/lib/fetchZeroTakeoutMonitor'
import { ZeroTakeoutEtgData, ZeroTakeoutEtgRow } from '@/lib/fetchZeroTakeoutMonitorEtg'

function formatCurrency(val: number): string {
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function formatToCDT(utcTimestamp: string): string {
  const date = new Date(utcTimestamp.replace(' UTC', 'Z').replace(' ', 'T'))
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

export default function ZeroTakeoutMonitorClient({
  hhr,
  etg,
}: {
  hhr: ZeroTakeoutData
  etg: ZeroTakeoutEtgData
}) {
  const [tab, setTab] = useState<'hhr' | 'etg'>('hhr')

  const active = tab === 'hhr' ? hhr : etg
  const rows = active.data ?? []
  const scanCount = tab === 'hhr' ? (hhr.site_count ?? 0) : (etg.schema_count ?? 0)
  const scanLabel = tab === 'hhr' ? 'Sites Checked' : 'Schemas Checked'

  const sortedHhr = [...(hhr.data ?? [])].sort((a, b) => b.occurrences - a.occurrences)
  const sortedEtg = [...(etg.data ?? [])].sort((a, b) => b.occurrences - a.occurrences)

  return (
    <>
      {/* HHR / ETG tabs */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center bg-[#13152a] border border-slate-700 rounded-lg p-1 gap-1">
          <button
            onClick={() => setTab('hhr')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              tab === 'hhr'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HHR
          </button>
          <button
            onClick={() => setTab('etg')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              tab === 'etg'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Roulette
          </button>
        </div>

        {active.error && (
          <span className="text-xs text-rose-400">
            {tab.toUpperCase()} error: {active.error}
          </span>
        )}

        {active.cached_at && (
          <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 w-fit ml-auto relative group cursor-help">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Updated</span>
            <span className="text-slate-200 text-xs font-semibold">{formatToCDT(active.cached_at)}</span>
            <span className="absolute top-full right-0 mt-2 w-64 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
              The last time this report was generated and cached.
            </span>
          </div>
        )}
      </div>

      {active.checkdate && (
        <div className="mb-6 flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 w-fit relative group cursor-help">
          <span className="text-slate-500 text-xs uppercase tracking-widest">Lookback</span>
          <span className="text-slate-200 text-xs font-semibold">{active.checkdate}</span>
          <span className="absolute top-full left-0 mt-2 w-64 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
            Start of the data window. Only transactions after this date are included.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-[#13152a] border border-emerald-900/50 rounded-lg p-5">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{scanLabel}</div>
          <div className="text-3xl font-bold text-emerald-400">{scanCount}</div>
        </div>
        <div className={`bg-[#13152a] border rounded-lg p-5 ${rows.length > 0 ? 'border-rose-900/50' : 'border-slate-800'}`}>
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Combos Flagged</div>
          <div className={`text-3xl font-bold ${rows.length > 0 ? 'text-rose-400' : 'text-white'}`}>{rows.length}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-[#13152a] border border-emerald-900/30 rounded-lg p-10 text-center">
          <p className="text-emerald-400 font-semibold">✅ No transactions found.</p>
        </div>
      ) : tab === 'hhr' ? (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#13152a] text-slate-400 text-xs uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Site</th>
                <th className="px-4 py-3 text-left">Math Name</th>
                <th className="px-4 py-3 text-right">Denom</th>
                <th className="px-4 py-3 text-right">Occurrences</th>
                <th className="px-4 py-3 text-right">Total Wager</th>
                <th className="px-4 py-3 text-left">First Seen</th>
                <th className="px-4 py-3 text-left">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {sortedHhr.map((row: ZeroTakeoutRow, i) => (
                <tr key={i} className="border-t border-slate-800 hover:bg-[#1a1d35] transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-orange-400">{row.sitename}</td>
                  <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{row.mathname}</td>
                  <td className="px-4 py-2.5 text-right text-slate-300">{row.denom}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-900/50 text-rose-300">
                      {row.occurrences}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-300 tabular-nums">{formatCurrency(row.total_wager)}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{row.first_seen}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{row.last_seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#13152a] text-slate-400 text-xs uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Schema</th>
                <th className="px-4 py-3 text-left">Site Code</th>
                <th className="px-4 py-3 text-left">Definition ID</th>
                <th className="px-4 py-3 text-right">Denom</th>
                <th className="px-4 py-3 text-right">Occurrences</th>
                <th className="px-4 py-3 text-right">Total Wager</th>
                <th className="px-4 py-3 text-left">First Seen</th>
                <th className="px-4 py-3 text-left">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {sortedEtg.map((row: ZeroTakeoutEtgRow, i) => (
                <tr key={i} className="border-t border-slate-800 hover:bg-[#1a1d35] transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-orange-400">{row.schema_name}</td>
                  <td className="px-4 py-2.5 text-slate-300">{row.site_code ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{row.definition_id ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-slate-300">{row.denomination ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-900/50 text-rose-300">
                      {row.occurrences}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-300 tabular-nums">{formatCurrency(row.total_wager)}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{row.first_seen}</td>
                  <td className="px-4 py-2.5 text-slate-400 text-xs">{row.last_seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}