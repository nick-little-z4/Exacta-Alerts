'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const DAY_OPTIONS = [
  { label: 'Latest', value: '1' },
  { label: '3 Days', value: '3' },
  { label: '7 Days', value: '7' },
]

export default function DateRangeFilter({ currentDays }: { currentDays: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleDays(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('days', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 text-xs uppercase tracking-widest">Period</span>
      <div className="flex gap-1">
        {DAY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleDays(opt.value)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              currentDays === opt.value
                ? 'bg-orange-500 text-white'
                : 'bg-[#13152a] border border-slate-700 text-slate-400 hover:border-orange-500 hover:text-orange-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}