import TabCard from '@/components/TabCard'
import { tabs } from '@/lib/tabs'
import { fetchLowPools } from '@/lib/fetchLowPools'
import { fetchManualHandicappingWins } from '@/lib/fetchManualHandicappingWins'
import { fetchAcknowledgedHandicappingWins } from '@/lib/fetchAcknowledgedHandicappingWins'
import { fetchReportComps } from '@/lib/fetchReportComps'
import { fetchNPrizes } from '@/lib/fetchNPrizes'

export const dynamic = 'force-dynamic'

function normalizeCheckdate(cd: string): string {
  return cd.replace(' ', 'T').split('.')[0]
}

export default async function Dashboard() {

  // Fetch all badge data in parallel — failures are silent
  const [lowPoolsResult, nPrizesResult, mhwResult, reportCompsResult, mhwAckResult] = await Promise.allSettled([
    fetchLowPools(),
    fetchNPrizes(),
    fetchManualHandicappingWins(),
    fetchReportComps(),
    fetchAcknowledgedHandicappingWins(),
  ])

  // Low pools — unacknowledged criticals
  const lowPoolsData = lowPoolsResult.status === 'fulfilled' ? lowPoolsResult.value : null
  const acknowledgedKeys = new Set((lowPoolsData?.acknowledged ?? []).map(a => `${a.site}-${a.mathname}-${a.denomination}`))
  const unacknowledgedCriticals = (lowPoolsData?.criticals ?? []).filter(r => !acknowledgedKeys.has(`${r.site}-${r.mathname}-${r.denomination}`)).length

  // Manual Handicapping Wins — sites with payout >= 100% and net win >= $100, minus acknowledged
  const mhwData = mhwResult.status === 'fulfilled' ? mhwResult.value : null
  const mhwAcknowledged = mhwAckResult.status === 'fulfilled' ? mhwAckResult.value : []
  const mhwAckKeys = new Set(
    mhwAcknowledged.map(a => `${a.sitename}-${normalizeCheckdate(a.checkdate)}`)
  )
  const mhwCheckdate = mhwData?.checkdate ?? ''
  const flaggedMHW = (mhwData?.data ?? []).filter(r => {
    const payout = parseFloat(r.payout)
    const netWin = r.net_win ?? 0
    if (!(payout >= 100 && netWin >= 100)) return false
    const key = `${r.sitename}-${normalizeCheckdate(mhwCheckdate)}`
    return !mhwAckKeys.has(key)
  }).length

  // Mismatch Reports — unacknowledged variances
  const reportCompsData = reportCompsResult.status === 'fulfilled' ? reportCompsResult.value : null
  const acknowledgedIds = new Set((reportCompsData?.acknowledged ?? []).map(a => a.ack_row_id))
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - 7)
  const unacknowledgedMismatches = (reportCompsData?.rows ?? []).filter(r => {
    if (!r.handleVariance || r.handleVariance === 0) return false
    if (acknowledgedIds.has(r.ackRowId)) return false
    const d = new Date(r.date)
    if (isNaN(d.getTime())) return true
    return d.getTime() >= cutoff.getTime()
  }).length

    // N Prizes
  const nPrizesData = nPrizesResult.status === 'fulfilled' ? nPrizesResult.value : null
  const highNPrizes = (nPrizesData?.data ?? []).filter(r => r.num_prizes >= 6).length

  // Summary bar totals
  const totalAlerts = unacknowledgedCriticals + flaggedMHW + unacknowledgedMismatches + highNPrizes
  const hasAlerts = totalAlerts > 0

  // Badge map by slug
  const badges: Record<string, { count: number; color: 'red' | 'amber' | 'sky' }> = {
    'low-pools': { count: unacknowledgedCriticals, color: 'red' },
    'manual-handicapping-wins': { count: flaggedMHW, color: 'red' },
    'daily-report-mismatch': { count: unacknowledgedMismatches, color: 'amber' },
    'n-prizes': { count: highNPrizes, color: 'amber' },
  }

  return (
    <div className="min-h-screen bg-[#131629] py-10 px-6">
      <div className="max-w-4xl mx-auto">

        <header className="border-b border-slate-700 pb-5 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-orange-400 to-pink-500" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Exacta Alerts</h1>
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
            <div className="flex flex-wrap gap-4">
              {unacknowledgedCriticals > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                  <span className="text-slate-500">Critical Pools</span>
                  <span className="font-bold text-rose-400">{unacknowledgedCriticals}</span>
                </div>
              )}
              {flaggedMHW > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span className="text-slate-500">MH Wins Flagged</span>
                  <span className="font-bold text-amber-400">{flaggedMHW}</span>
                </div>
              )}
              {unacknowledgedMismatches > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span className="text-slate-500">Mismatches</span>
                  <span className="font-bold text-amber-400">{unacknowledgedMismatches}</span>
                </div>
              )}
              {highNPrizes > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span className="text-slate-500">N Prizes</span>
                  <span className="font-bold text-amber-400">{highNPrizes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">
          Dashboard Tabs
        </p>
        <div className="grid grid-cols-2 gap-4">
          {tabs.map((tab) => (
            <TabCard
              key={tab.slug}
              tab={tab}
              badge={badges[tab.slug]}
            />
          ))}
        </div>

      </div>
    </div>
  )
}