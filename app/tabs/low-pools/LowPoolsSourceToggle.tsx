'use client'

import { useState } from 'react'
import LowPoolsClient from './LowPoolsClient'
import { LowPoolsData } from '@/lib/fetchLowPools'
import { RoulettePoolData } from '@/lib/fetchRoulettePool'

export interface LowPoolsComparisonData {
  legacy: LowPoolsData
  new: LowPoolsData
}

export default function LowPoolsSourceToggle({
  comparison,
  rouletteData,
}: {
  comparison: LowPoolsComparisonData
  rouletteData: RoulettePoolData | null
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
            ECS
          </button>
        </div>

        {active.error && (
          <span className="text-xs text-rose-400">
            {source} error: {active.error}
          </span>
        )}
      </div>

      <LowPoolsClient key={source} data={active} rouletteData={rouletteData} source={source} />
    </>
  )
}