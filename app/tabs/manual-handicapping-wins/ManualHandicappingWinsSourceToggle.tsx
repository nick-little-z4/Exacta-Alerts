'use client'

import { useState } from 'react'
import ManualHandicappingWinsClient from './ManualHandicappingWinsClient'
import { ManualHandicappingWinsComparisonData } from '@/lib/fetchManualHandicappingWins'
import { AcknowledgedHandicappingWin } from '@/lib/fetchAcknowledgedHandicappingWins'

export default function ManualHandicappingWinsSourceToggle({
  comparison,
  initialAcknowledged,
  initialAcknowledgedNew,
}: {
  comparison: ManualHandicappingWinsComparisonData
  initialAcknowledged: AcknowledgedHandicappingWin[]
  initialAcknowledgedNew: AcknowledgedHandicappingWin[]
}) {
  const [source, setSource] = useState<'legacy' | 'new'>('legacy')
  const active = comparison[source]

  const updatedTimestamp = active.cached_at
    ? new Date(active.cached_at.replace(' UTC', 'Z').replace(' ', 'T')).toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) + ' CDT'
    : 'Unknown'

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center bg-[#13152a] border border-slate-700 rounded-lg p-1 gap-1">
          <button
            onClick={() => setSource('legacy')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              source === 'legacy'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Legacy
          </button>
          <button
            onClick={() => setSource('new')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              source === 'new'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New
          </button>
        </div>

        <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 relative group cursor-help">
          <span className="text-slate-500 text-xs uppercase tracking-widest">Updated</span>
          <span className="text-slate-200 text-xs font-semibold">{updatedTimestamp}</span>
          <span className="absolute top-full left-0 mt-2 w-64 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
            The last time this report was generated and cached ({source}).
          </span>
        </div>

        <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2">
          <span className="text-slate-500 text-xs uppercase tracking-widest">Refreshes</span>
          <span className="text-slate-200 text-xs font-semibold">Every 2 hours</span>
        </div>

        {active.checkdate && (
          <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 relative group cursor-help">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Lookback</span>
            <span className="text-slate-200 text-xs font-semibold">
              {active.checkdate.split('T')[0] || active.checkdate.split(' ')[0]}
            </span>
            <span className="absolute top-full left-0 mt-2 w-64 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
              Start of the 96-hour data window. Only transactions after this date/time are included in this report.
            </span>
          </div>
        )}

        {active.error && (
          <span className="text-xs text-rose-400">
            {source} error: {active.error}
          </span>
        )}
      </div>

      <ManualHandicappingWinsClient
        key={source}
        rows={active.data ?? []}
        checkdate={active.checkdate ?? null}
        initialAcknowledged={source === 'legacy' ? initialAcknowledged : initialAcknowledgedNew}
        readOnly={false}
        source={source}
      />
    </>
  )
}