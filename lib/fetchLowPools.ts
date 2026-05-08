import { fetchAWS } from './fetchAWS'

export interface PoolRow {
  site: string
  manufacturerid: string
  mathname: string
  denomination: string
  poolbalance: string
  poolpercentage: string
  last_updated?: string
  first_seen?: string
  is_new_today?: boolean
}

export interface AcknowledgedPool {
  site: string
  mathname: string
  denomination: string
  acknowledged_at?: string
  acknowledged_by?: string
}

export interface LowPoolsData {
  criticals: PoolRow[]
  warnings: PoolRow[]
  new_entries: PoolRow[]
  new_criticals: PoolRow[]
  all_pools: PoolRow[]
  critical_count: number
  warning_count: number
  new_entry_count: number
  new_critical_count: number
  total_pool_count: number
  acknowledged: AcknowledgedPool[]
}

export async function fetchLowPools(): Promise<LowPoolsData> {
  const [poolsRes, acknowledgedRes] = await Promise.all([
    fetch(
      `${process.env.AWS_API_GATEWAY_BASE_URL}/low-pools`,
      {
        headers: { 'x-api-key': process.env.AWS_API_KEY! },
        cache: 'no-store',
      }
    ),
    fetch(
      `${process.env.AWS_API_GATEWAY_BASE_URL}/low-pools/acknowledged`,
      {
        headers: { 'x-api-key': process.env.AWS_API_KEY! },
        cache: 'no-store',
      }
    ),
  ])

  if (!poolsRes.ok) {
    throw new Error(`Failed to fetch pools: ${poolsRes.status}`)
  }

  const poolsData = await poolsRes.json()
  const body = typeof poolsData.body === 'string' ? JSON.parse(poolsData.body) : poolsData

  // Don't crash the page if acknowledged fetch fails
  let acknowledged: AcknowledgedPool[] = []
  if (acknowledgedRes.ok) {
    const acknowledgedData = await acknowledgedRes.json()
    const acknowledgedBody = typeof acknowledgedData.body === 'string'
      ? JSON.parse(acknowledgedData.body)
      : acknowledgedData
    acknowledged = acknowledgedBody.acknowledged ?? []
  } else {
    console.warn(`[fetchLowPools] acknowledged fetch failed: ${acknowledgedRes.status}`)
  }

  return {
    ...body,
    acknowledged,
  }
}