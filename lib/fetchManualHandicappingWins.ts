import { unstable_cache } from 'next/cache'

// Shared data is cached on the server for CACHE_SECONDS so every visitor reads the
// same copy instead of each one calling the backend. Acknowledgements stay live.
const CACHE_SECONDS = 120

export interface WinRow {
  sitename: string
  wager: number
  payout: string
  plays: number
  prizes?: number
  net_win?: number
}

export interface ManualHandicappingWinsData {
  action: string
  checkdate: string
  site_count: number
  data: WinRow[]
  email_sent: boolean
  cached_at?: string | null
  error?: string | null
}

async function fetchManualHandicappingWinsUncached(): Promise<ManualHandicappingWinsData> {
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/manual-handicapping-wins`,
    {
      headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
      cache: 'no-store'
    }
  )

  if (!res.ok) throw new Error(`AWS API error: ${res.status}`)

  const data = await res.json()
  const body = typeof data.body === 'string' ? JSON.parse(data.body) : data
  return body
}
export const fetchManualHandicappingWins = unstable_cache(fetchManualHandicappingWinsUncached, ['mhw'], { revalidate: CACHE_SECONDS })