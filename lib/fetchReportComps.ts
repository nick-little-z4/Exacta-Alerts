import { unstable_cache } from 'next/cache'

// Shared data is cached on the server for CACHE_SECONDS so every visitor reads the
// same copy instead of each one calling the backend. Acknowledgements stay live.
const CACHE_SECONDS = 120

export interface ReportCompRow {
  ackRowId: string
  date: string
  market: string
  enterprise: string
  system: string
  gameType: string
  handleVariance: number | null
  sysHandle: number | null
  dwHandle: number | null
}

export interface AcknowledgedReportComp {
  ack_row_id: string
  acknowledged_at?: string
  acknowledged_by?: string
  is_acknowledged?: boolean
  notes?: string | null
  notes_updated_at?: string | null
  notes_updated_by?: string | null
}

/**
 * Rows come from the daily snapshot (report_comps_snapshot Lambda, served at
 * GET /report-comps), not from Tableau live, so the page only changes once a
 * day at the snapshot time.
 */
async function fetchReportRowsUncached(): Promise<{ rows: ReportCompRow[]; snapshotAt: string | null }> {
  const res = await fetch(`${process.env.EXACTA_API_BASE_URL}/report-comps`, {
    headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Report comps snapshot returned ${res.status}`)
  const json = await res.json()
  const body = typeof json.body === 'string' ? JSON.parse(json.body) : json
  return { rows: body.rows ?? [], snapshotAt: body.snapshot_at ?? null }
}

const fetchReportRowsCached = unstable_cache(fetchReportRowsUncached, ['report-comps-snapshot'], { revalidate: CACHE_SECONDS })

// Live: acknowledgements and notes show up right away
async function fetchAcknowledgedReportComps(): Promise<AcknowledgedReportComp[]> {
  const res = await fetch(`${process.env.EXACTA_API_BASE_URL}/report-comps/acknowledged`, {
    headers: { 'x-api-key': process.env.EXACTA_API_KEY! },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const ackData = await res.json()
  const ackBody = typeof ackData.body === 'string' ? JSON.parse(ackData.body) : ackData
  return ackBody.acknowledged ?? []
}

export async function fetchReportComps(): Promise<{
  rows: ReportCompRow[]
  acknowledged: AcknowledgedReportComp[]
  /** When the daily snapshot was taken (ISO, UTC) */
  snapshotAt: string | null
}> {
  const [snap, acknowledged] = await Promise.all([
    fetchReportRowsCached(),
    fetchAcknowledgedReportComps().catch(() => [] as AcknowledgedReportComp[]),
  ])
  return { rows: snap.rows, acknowledged, snapshotAt: snap.snapshotAt }
}