import Link from 'next/link'
import { Tab } from '@/lib/tabs'

export default function TabCard({ tab }: { tab: Tab }) {
  return (
    <Link
      href={`/tabs/${tab.slug}`}
      className="relative block bg-[#13152a] border border-slate-800 rounded-lg p-5 hover:border-slate-600 hover:bg-[#1a1d35] transition-all group overflow-hidden"
    >
      {/* Gradient top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-pink-500" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 font-bold text-white mb-2">
          <span className="w-7 h-7 bg-slate-800 rounded-md flex items-center justify-center text-sm">
            {tab.icon}
          </span>
          {tab.title}
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