import { NPrizesRow } from '@/lib/fetchNPrizes'

export interface AcknowledgedNPrize {
  ack_key: string
  sitename?: string
  mathname?: string
  denom?: number
  num_prizes?: number
  is_acknowledged?: boolean
  acknowledged_at?: string
  acknowledged_by?: string
  notes?: string | null
  notes_updated_at?: string | null
  notes_updated_by?: string | null
}

/** One key per event: a new big payout on the same game gets a new key. */
export function nPrizesAckKey(r: Pick<NPrizesRow, 'sitename' | 'mathname' | 'denom' | 'top_prizes'>): string {
  return `${r.sitename}|${r.mathname}|${r.denom}|${r.top_prizes}`
}

// Live (not cached) so an acknowledgement shows up right away
export async function fetchNPrizesAcknowledged(): Promise<AcknowledgedNPrize[]> {
  const res = await fetch(`${process.env.EXACTA_API_BASE_URL}/n-prizes/acknowledge`, {
    headers: { 'x-api-key': process.env.EXACTA_API_KEY ?? '' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Failed to fetch N Prizes acknowledgements: ${res.status}`)
  const json = await res.json()
  const body = typeof json.body === 'string' ? JSON.parse(json.body) : json
  return body.acknowledged ?? []
}