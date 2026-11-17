import Link from 'next/link'
import TabCard from '@/components/TabCard'
import HomeLive from '@/components/HomeLive'
import { tabs } from '@/lib/tabs'
import { getBadgeSummary } from '@/lib/badges'
import { TvModeToggle } from '@/components/TvMode'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {

  // All alert rules live in lib/badges.ts (shared with /api/badges and TV mode)
  const summary = await getBadgeSummary()
  const totalAlerts = summary.total
  const hasAlerts = totalAlerts > 0

  // Badge map by slug
  const badges: Record<string, { count: number; color: 'red' | 'amber' | 'sky' }> = Object.fromEntries(
    Object.values(summary.badges).map(b => [b.key, { count: b.count, color: b.color }])
  )

  // Summary bar chips (each links to its tab)
  const chips = Object.values(summary.badges)
    .filter(b => b.count > 0)
    .map(b => ({ slug: b.key, label: b.label, count: b.count, tone: b.key === 'low-pools' || b.key === 'bet-type-pvalues' ? 'rose' : 'amber' }))

  // Alerts first: tabs with active badges move to the top, highest count first
  const sortedTabs = [...tabs].sort((a, b) => (badges[b.slug]?.count ?? 0) - (badges[a.slug]?.count ?? 0))

  return (
    <div className="min-h-screen bg-[#131629] py-10 px-6">
      <div className="max-w-4xl mx-auto">

        <header className="border-b border-slate-700 pb-5 mb-8">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-orange-400 to-pink-500" />
              <h1 className="text-2xl font-bold text-white tracking-tight">Exacta Alerts</h1>
            </div>
            <div className="flex items-center gap-2">
              <TvModeToggle />
              {/* Ends the 7-day login session (hidden in TV mode) */}
              <a
                href="/auth/logout"
                data-tv-hide
                className="text-xs px-3 py-1.5 rounded-md border border-slate-700 text-slate-400 hover:border-rose-500 hover:text-rose-300 transition-colors"
              >
                Sign out
              </a>
            </div>
          </div>
        </header>

        {/* Summary Bar */}
        <div className={`rounded-lg border px-5 py-4 mb-8 ${
          hasAlerts
            ? 'bg-rose-950/20 border-rose-800/50'
            : 'bg-emerald-950/20 border-emerald-800/50'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold uppercase tracking-widest ${hasAlerts ? 'text-rose-400' : 'text-emerald-400'}`}>
                {hasAlerts ? `⚠️ ${totalAlerts} Alert${totalAlerts !== 1 ? 's' : ''} Require Attention` : '✅ All Clear'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {chips.map(c => (
                <Link
                  key={c.slug}
                  href={`/tabs/${c.slug}`}
                  className="flex items-center gap-1.5 text-xs text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 hover:border-slate-500 hover:bg-slate-800/60 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full inline-block ${c.tone === 'rose' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                  <span className="text-slate-400">{c.label}</span>
                  <span className={`font-bold ${c.tone === 'rose' ? 'text-rose-400' : 'text-amber-400'}`}>{c.count}</span>
                  <span className="text-slate-600">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">
          Dashboard Tabs
        </p>
        <div className="grid grid-cols-2 gap-4">
          {sortedTabs.map((tab) => (
            <TabCard
              key={tab.slug}
              tab={tab}
              badge={badges[tab.slug]}
            />
          ))}
        </div>

        <HomeLive totalAlerts={totalAlerts} />
      </div>
    </div>
  )
}