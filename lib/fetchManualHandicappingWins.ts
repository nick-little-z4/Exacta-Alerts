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
  checkdate: string | null
  site_count: number
  data: WinRow[]
  email_sent: boolean
  cached_at?: string | null
  error?: string | null
}

export interface ManualHandicappingWinsComparisonData {
  legacy: ManualHandicappingWinsData
  new: ManualHandicappingWinsData
}

export async function fetchManualHandicappingWins(): Promise<ManualHandicappingWinsComparisonData> {
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