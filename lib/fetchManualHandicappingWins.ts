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
  cached_at?: string
}

export async function fetchManualHandicappingWins(): Promise<ManualHandicappingWinsData> {
  const res = await fetch(
    `${process.env.AWS_API_GATEWAY_BASE_URL}/manual-handicapping-wins`,
    {
      headers: { 'x-api-key': process.env.AWS_API_KEY! },
      cache: 'no-store', // always fetch latest from S3 reader
    }
  )

  if (!res.ok) throw new Error(`AWS API error: ${res.status}`)

  const data = await res.json()
  const body = typeof data.body === 'string' ? JSON.parse(data.body) : data
  return body
}