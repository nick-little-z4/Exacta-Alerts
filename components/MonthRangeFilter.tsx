'use client'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const OPTIONS = [
  { label: 'Last 3 months',  value: '3' },
  { label: 'Last 6 months',  value: '6' },
]

export default function MonthRangeFilter({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('window', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 uppercase tracking-widest">Showing</span>
      <select
        value={current}
        onChange={e => handleChange(e.target.value)}
        className="bg-[#13152a] border border-slate-700 text-slate-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-orange-400 cursor-pointer"
      >
        {OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}