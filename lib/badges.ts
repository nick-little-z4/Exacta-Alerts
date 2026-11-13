/**
 * Shared badge summary.
 *
 * One place that decides what counts as an alert on each tab. The home page,
 * /api/badges (Slack notifier) and TV mode all use this, so their numbers
 * always match.
 *
 * Each item has a stable `id` so the Slack notifier can tell new alerts from
 * ones it already posted.
 */
import { fetchLowPools } from '@/lib/fetchLowPools'
import { fetchManualHandicappingWins } from '@/lib/fetchManualHandicappingWins'
import { fetchAcknowledgedHandicappingWinsNew as fetchAcknowledgedHandicappingWins } from '@/lib/fetchAcknowledgedHandicappingWinsNew'
import { fetchReportComps } from '@/lib/fetchReportComps'
import { fetchNPrizes } from '@/lib/fetchNPrizes'
import { fetchNPrizesAcknowledged, nPrizesAckKey } from '@/lib/fetchNPrizesAcknowledged'
import { fetchBetTypePvalues } from '@/lib/fetchBetTypePvalues'

// Alert rules
export const N_PRIZES_ALERT_THRESHOLD = 10
export const MHW_PAYOUT_THRESHOLD = 100
export const MHW_NET_WIN_THRESHOLD = 100
export const MISMATCH_LOOKBACK_DAYS = 7
export const PVALUE_ALPHA = 0.05

// Each source gets a time limit so one slow source can't hold up everything
const SOURCE_TIMEOUT_MS = 8000

export type BadgeKey = 'low-pools' | 'manual-handicapping-wins' | 'daily-report-mismatch' | 'n-prizes' | 'bet-type-pvalues'

export interface BadgeItem {
  id: string
  title: string
  detail: string
  [key: string]: unknown
}

export interface Badge {
  key: BadgeKey
  label: string
  color: 'red' | 'amber'
  count: number
  items: BadgeItem[]
  /**
   * Every flagged item, acknowledged or not. Only set where Slack needs to watch
   * acknowledged items too (MH Wins: re-alert when net win grows). Not counted.
   */
  watch?: BadgeItem[]
  error: string | null
}

export interface BadgeSummary {
  generated_at: string
  total: number
  badges: Record<BadgeKey, Badge>
}

async function source<T>(name: string, p: Promise<T>): Promise<T> {
  const start = Date.now()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${name} timed out after ${SOURCE_TIMEOUT_MS}ms`)), SOURCE_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
    console.log(`[badges] ${name}: ${Date.now() - start}ms`)
  }
}

function errorOf(r: PromiseSettledResult<unknown>): string | null {
  return r.status === 'rejected' ? String(r.reason) : null
}

function normalizeCheckdate(cd: string): string {
  return cd.replace(' ', 'T').split('.')[0]
}

function money(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return '-'
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function denomLabel(cents: number): string {
  const d = cents / 100
  return d >= 1 ? `$${d.toFixed(0)}` : `$${d.toFixed(2)}`
}

function pctLabel(raw: string): string {
  const n = parseFloat(raw)
  if (isNaN(n)) return raw
  return `${(n <= 1 ? n * 100 : n).toFixed(1)}%`
}

export async function getBadgeSummary(): Promise<BadgeSummary> {
  const [lowPoolsR, nPrizesR, nPrizesAckR, mhwR, mhwAckR, reportCompsR, pvalR] = await Promise.allSettled([
    source('lowPools', fetchLowPools()),
    source('nPrizes', fetchNPrizes()),
    source('nPrizesAck', fetchNPrizesAcknowledged()),
    source('mhw', fetchManualHandicappingWins()),
    source('mhwAck', fetchAcknowledgedHandicappingWins()),
    source('reportComps', fetchReportComps()),
    source('pvalues', fetchBetTypePvalues()),
  ])

  // Low Pools: unacknowledged criticals
  const lowPools = lowPoolsR.status === 'fulfilled' ? lowPoolsR.value : null
  const poolAcked = new Set((lowPools?.acknowledged ?? []).map(a => `${a.site}-${a.mathname}-${a.denomination}`))
  const poolItems: BadgeItem[] = (lowPools?.criticals ?? [])
    .filter(r => !poolAcked.has(`${r.site}-${r.mathname}-${r.denomination}`))
    .map(r => ({
      id: `pool|${r.site}|${r.mathname}|${r.denomination}`,
      title: `${r.site} · ${r.mathname} · ${r.denomination}`,
      detail: `Pool at ${pctLabel(r.poolpercentage)}`,
      site: r.site,
      mathname: r.mathname,
      denomination: r.denomination,
      poolpercentage: r.poolpercentage,
      poolbalance: r.poolbalance,
    }))

  // Manual Handicapping Wins: payout >= 100% and net win >= $100, minus acknowledged
  const mhw = mhwR.status === 'fulfilled' ? mhwR.value : null
  const mhwAcked = new Set(
    (mhwAckR.status === 'fulfilled' ? mhwAckR.value : []).map(a => `${a.sitename}-${normalizeCheckdate(a.checkdate)}`)
  )
  const mhwCheckdate = normalizeCheckdate(mhw?.checkdate ?? '')
  const mhwToItem = (r: NonNullable<typeof mhw>['data'][number]): BadgeItem => ({
    // Not keyed on checkdate: it moves every writer run, which made the same
    // site look like a new alert (and the old one "cleared") each time
    id: `mhw|${r.sitename}`,
    title: r.sitename,
    detail: `Payout ${r.payout} · Net win ${money(r.net_win)}`,
    sitename: r.sitename,
    payout: r.payout,
    net_win: r.net_win,
    wager: r.wager,
    checkdate: mhwCheckdate,
  })
  // Every flagged site, acknowledged or not (Slack watches these for net win increases)
  const mhwFlagged = (mhw?.data ?? []).filter(r => {
    const payout = parseFloat(r.payout)
    const netWin = r.net_win ?? 0
    return payout >= MHW_PAYOUT_THRESHOLD && netWin >= MHW_NET_WIN_THRESHOLD
  })
  const mhwWatch: BadgeItem[] = mhwFlagged.map(mhwToItem)
  // The badge counts only the ones not acknowledged
  const mhwItems: BadgeItem[] = mhwFlagged
    .filter(r => !mhwAcked.has(`${r.sitename}-${mhwCheckdate}`))
    .map(mhwToItem)

  // Mismatch Reports: unacknowledged variances in the last 7 days
  const comps = reportCompsR.status === 'fulfilled' ? reportCompsR.value : null
  const compAcked = new Set((comps?.acknowledged ?? []).filter(a => a.is_acknowledged !== false).map(a => a.ack_row_id))
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - MISMATCH_LOOKBACK_DAYS)
  const mismatchItems: BadgeItem[] = (comps?.rows ?? [])
    .filter(r => {
      if (!r.handleVariance || r.handleVariance === 0) return false
      if (compAcked.has(r.ackRowId)) return false
      const d = new Date(r.date)
      return isNaN(d.getTime()) || d.getTime() >= cutoff.getTime()
    })
    .map(r => ({
      id: `mismatch|${r.ackRowId}`,
      title: `${r.date} · ${r.market} · ${r.enterprise} · ${r.system}`,
      detail: `${r.gameType} · Handle variance ${money(r.handleVariance)}`,
      ackRowId: r.ackRowId,
      date: r.date,
      market: r.market,
      enterprise: r.enterprise,
      system: r.system,
      gameType: r.gameType,
      handleVariance: r.handleVariance,
    }))

  // N Prizes: 10+ prizes, minus acknowledged
  const nPrizes = nPrizesR.status === 'fulfilled' ? nPrizesR.value : null
  const nAcked = new Set(
    (nPrizesAckR.status === 'fulfilled' ? nPrizesAckR.value : [])
      .filter(a => a.is_acknowledged !== false)
      .map(a => a.ack_key)
  )
  const nPrizeItems: BadgeItem[] = (nPrizes?.data ?? [])
    .filter(r => r.num_prizes >= N_PRIZES_ALERT_THRESHOLD && !nAcked.has(nPrizesAckKey(r)))
    .map(r => ({
      id: `nprizes|${nPrizesAckKey(r)}`,
      title: `${r.sitename} · ${r.mathname} · ${denomLabel(r.denom)}`,
      detail: `${r.num_prizes} prizes to reach ${money(r.netprizes)}`,
      sitename: r.sitename,
      mathname: r.mathname,
      denom: r.denom,
      num_prizes: r.num_prizes,
      netprizes: r.netprizes,
      top_prizes: r.top_prizes,
    }))

  // Roulette P Values: BH-significant cells in the past 7 days
  const pvals = pvalR.status === 'fulfilled' ? pvalR.value : null
  const pvalItems: BadgeItem[] = (pvals?.windows?.['7d'] ?? [])
    .filter(r => r.tested && ((r.p_usd_bh ?? 1) < PVALUE_ALPHA || (r.p_hits_bh ?? 1) < PVALUE_ALPHA))
    .map(r => {
      const tests = [
        (r.p_usd_bh ?? 1) < PVALUE_ALPHA ? `dollars p=${(r.p_usd_bh ?? 0).toFixed(4)}` : null,
        (r.p_hits_bh ?? 1) < PVALUE_ALPHA ? `hit rate p=${(r.p_hits_bh ?? 0).toFixed(4)}` : null,
      ].filter(Boolean).join(' · ')
      return {
        // Not keyed on generated_at, which changes every run
        id: `pvalue|${r.site}|${r.wager_name}`,
        title: `${r.site} · ${r.wager_name}`,
        detail: `${tests} · Net vs theo ${money(r.net_vs_theo)}`,
        site: r.site,
        wager_name: r.wager_name,
        p_usd_bh: r.p_usd_bh,
        p_hits_bh: r.p_hits_bh,
        net_vs_theo: r.net_vs_theo,
        z: r.z,
      }
    })

  const badges: Record<BadgeKey, Badge> = {
    'low-pools': {
      key: 'low-pools', label: 'Critical Pools', color: 'red',
      count: poolItems.length, items: poolItems, error: errorOf(lowPoolsR),
    },
    'manual-handicapping-wins': {
      key: 'manual-handicapping-wins', label: 'MH Wins Flagged', color: 'red',
      count: mhwItems.length, items: mhwItems, watch: mhwWatch, error: errorOf(mhwR),
    },
    'daily-report-mismatch': {
      key: 'daily-report-mismatch', label: 'Mismatches', color: 'amber',
      count: mismatchItems.length, items: mismatchItems, error: errorOf(reportCompsR),
    },
    'n-prizes': {
      key: 'n-prizes', label: `N Prizes ≥${N_PRIZES_ALERT_THRESHOLD}`, color: 'amber',
      count: nPrizeItems.length, items: nPrizeItems, error: errorOf(nPrizesR),
    },
    'bet-type-pvalues': {
      key: 'bet-type-pvalues', label: 'Roulette P Values', color: 'red',
      count: pvalItems.length, items: pvalItems,
      error: pvalR.status === 'rejected' ? String(pvalR.reason) : pvals === null ? 'P values unavailable' : null,
    },
  }

  const total = Object.values(badges).reduce((s, b) => s + b.count, 0)

  return { generated_at: new Date().toISOString(), total, badges }
}