export interface ZeroTakeoutRow {
  sitename: string
  mathname: string
  denom: number
  occurrences: number
  total_wager: number
  first_seen: string
  last_seen: string
}

export interface ZeroTakeoutData {
  checkdate: string | null
  site_count: number
  data: ZeroTakeoutRow[]
  cached_at?: string | null
  error?: string | null
}

export async function fetchZeroTakeoutMonitor(): Promise<ZeroTakeoutData> {
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/zero-takeout-monitor`,
    {
      headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
      cache: 'no-store',
    }
  )

  if (!res.ok) throw new Error(`Failed to fetch zero-takeout monitor: ${res.status}`)

  const data = await res.json()
  const body = typeof data.body === 'string' ? JSON.parse(data.body) : data
  return body
}