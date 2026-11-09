import { unstable_cache } from 'next/cache'

// Shared data is cached on the server for CACHE_SECONDS so every visitor reads the
// same copy instead of each one calling the backend. Acknowledgements stay live.
const CACHE_SECONDS = 120

export interface NPrizesRow {
  mathname: string
  denom: number
  sitename: string
  netprizes: number
  num_prizes: number
  top_prizes: string
  first_exceeding_row: number
}

export interface NPrizesData {
  data: NPrizesRow[]
  count: number
  timestamp: string
}

async function fetchNPrizesUncached(): Promise<NPrizesData> {
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/n-prizes`,
    {
      headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
      cache: 'no-store'
    }
  )

  if (!res.ok) throw new Error(`Failed to fetch n-prizes: ${res.status}`)

  const json = await res.json()
  const body = typeof json.body === 'string' ? JSON.parse(json.body) : json
  return body
}
export const fetchNPrizes = unstable_cache(fetchNPrizesUncached, ['n-prizes'], { revalidate: CACHE_SECONDS })