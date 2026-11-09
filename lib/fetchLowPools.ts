import { unstable_cache } from 'next/cache'

// Shared data is cached on the server for CACHE_SECONDS so every visitor reads the
// same copy instead of each one calling the backend. Acknowledgements stay live.
const CACHE_SECONDS = 120

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
  notes?: string
}

export interface AcknowledgedPool {
  site: string
  mathname: string
  denomination: string
  acknowledged_at?: string
  acknowledged_by?: string
  notes?: string
  poolbalance?: string
  poolpercentage?: string
  manufacturerid?: string
}

export interface LowPoolsData {
  last_run?: string | null
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

async function fetchPoolsUncached() {
  const poolsRes = await fetch(`${process.env.EXACTA_API_BASE_URL}/low-pools-ecs`, {
    headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
    cache: 'no-store',
  })
  if (!poolsRes.ok) {
    throw new Error(`Failed to fetch pools: ${poolsRes.status}`)
  }
  const poolsData = await poolsRes.json()
  return typeof poolsData.body === 'string' ? JSON.parse(poolsData.body) : poolsData
}

const fetchPoolsCached = unstable_cache(fetchPoolsUncached, ['low-pools'], { revalidate: CACHE_SECONDS })

// Live: an acknowledgement shows up right away
async function fetchAcknowledgedPools(): Promise<AcknowledgedPool[]> {
  const acknowledgedRes = await fetch(`${process.env.EXACTA_API_BASE_URL}/low-pools-ecs/acknowledged`, {
    headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
    cache: 'no-store',
  })
  if (!acknowledgedRes.ok) {
    console.warn(`[fetchLowPools] acknowledged fetch failed: ${acknowledgedRes.status}`)
    return []
  }
  const acknowledgedData = await acknowledgedRes.json()
  const acknowledgedBody = typeof acknowledgedData.body === 'string'
    ? JSON.parse(acknowledgedData.body)
    : acknowledgedData
  return acknowledgedBody.acknowledged ?? []
}

export async function fetchLowPools(): Promise<LowPoolsData> {
  const [body, acknowledged] = await Promise.all([
    fetchPoolsCached(),
    fetchAcknowledgedPools().catch(() => [] as AcknowledgedPool[]),
  ])
  return {
    ...body,
    acknowledged,
  }
}