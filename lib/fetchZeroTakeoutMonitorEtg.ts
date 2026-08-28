export interface ZeroTakeoutEtgRow {
  schema_name: string
  site_code?: string
  definition_id?: string
  denomination?: number
  occurrences: number
  total_wager: number
  first_seen: string
  last_seen: string
}

export interface ZeroTakeoutEtgData {
  checkdate: string | null
  schema_count: number
  data: ZeroTakeoutEtgRow[]
  cached_at?: string | null
  error?: string | null
}

export async function fetchZeroTakeoutMonitorEtg(): Promise<ZeroTakeoutEtgData> {
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/zero-takeout-monitor-etg`,
    {
      headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
      cache: 'no-store',
    }
  )

  if (!res.ok) throw new Error(`Failed to fetch ETG zero-takeout monitor: ${res.status}`)

  const data = await res.json()
  const body = typeof data.body === 'string' ? JSON.parse(data.body) : data
  return body
}