import Link from 'next/link'
import { Tab } from '@/lib/tabs'

interface BadgeInfo {
  count: number
  color: 'red' | 'amber' | 'sky'
}

export default function TabCard({ tab, badge }: { tab: Tab; badge?: BadgeInfo }) {
  const active = !!badge && badge.count > 0
  const ring =
    !active ? '' :
    badge!.color === 'red' ? 'border-rose-700/70 shadow-[0_0_18px_rgba(244,63,94,0.18)]' :
    badge!.color === 'amber' ? 'border-amber-700/70 shadow-[0_0_18px_rgba(245,158,11,0.15)]' :
    'border-sky-700/70'

  return (
    <Link
      href={`/tabs/${tab.slug}`}
      className={`relative block bg-[#13152a] border border-slate-800 rounded-lg p-5 hover:border-slate-600 hover:bg-[#1a1d35] transition-all group overflow-hidden ${ring}`}
    >
      {/* Gradient top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-pink-500" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 font-bold text-white mb-2">
          <span className="w-7 h-7 bg-slate-800 rounded-md flex items-center justify-center text-sm">
            {tab.icon}
          </span>
          {tab.title}
          {active && (
            <span className="relative ml-1 inline-flex">
              <span className={`absolute inset-0 rounded-full animate-ping opacity-40 ${
                badge!.color === 'red' ? 'bg-rose-500' : badge!.color === 'amber' ? 'bg-amber-500' : 'bg-sky-500'
              }`} />
              <span className={`relative px-1.5 py-0.5 rounded-full text-xs font-bold ${
                badge!.color === 'red' ? 'bg-rose-900/70 text-rose-300 border border-rose-700/50' :
                badge!.color === 'amber' ? 'bg-amber-900/70 text-amber-300 border border-amber-700/50' :
                'bg-sky-900/70 text-sky-300 border border-sky-700/50'
              }`}>
                {badge!.count}
              </span>
            </span>
          )}
        </div>
        <span className="text-slate-600 group-hover:text-orange-400 transition-colors">→</span>
      </div>

      <p className="text-sm text-slate-300 line-clamp-2 mb-3">{tab.goal}</p>

      {tab.lastUpdated && (
        <p className="text-xs text-slate-300">Updated {tab.lastUpdated}</p>
      )}
    </Link>
  )
}