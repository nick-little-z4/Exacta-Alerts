'use client'

import { useState } from 'react'
import ManualHandicappingWinsClient from './ManualHandicappingWinsClient'
import { ManualHandicappingWinsComparisonData } from '@/lib/fetchManualHandicappingWins'
import { AcknowledgedHandicappingWin } from '@/lib/fetchAcknowledgedHandicappingWins'

export default function ManualHandicappingWinsSourceToggle({
  comparison,
  initialAcknowledged,
}: {
  comparison: ManualHandicappingWinsComparisonData
  initialAcknowledged: AcknowledgedHandicappingWin[]
}) {
  const [source, setSource] = useState<'legacy' | 'new'>('legacy')
  const active = comparison[source]

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
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

        {source === 'new' && (
          <span className="text-xs text-amber-400">
            ⚠ Viewing new server — validation only, acknowledge actions are disabled here
          </span>
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
        initialAcknowledged={source === 'legacy' ? initialAcknowledged : []}
        readOnly={source === 'new'}
      />
    </>
  )
}