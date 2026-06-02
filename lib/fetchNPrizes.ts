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

export async function fetchNPrizes(): Promise<NPrizesData> {
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/n-prizes`,
    {
      headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
      next: { revalidate: 3600 } // 1 hour
    }
  )

  if (!res.ok) throw new Error(`Failed to fetch n-prizes: ${res.status}`)

  const json = await res.json()
  const body = typeof json.body === 'string' ? JSON.parse(json.body) : json
  return body
}