export interface AcknowledgedHandicappingWin {
  sitename: string
  checkdate: string
  acknowledged_at?: string
  acknowledged_by?: string
}

export async function fetchAcknowledgedHandicappingWins(): Promise<AcknowledgedHandicappingWin[]> {
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/manual-handicapping-wins/acknowledge`,
    {
      headers: { 'x-api-key': process.env.EXACTA_API_KEY ?? '' },
      cache: 'no-store',
    }
  )
  if (!res.ok) throw new Error(`Failed to fetch acknowledged wins: ${res.status}`)
  const json = await res.json()
  return json.acknowledged ?? []
}