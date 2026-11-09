import { unstable_cache } from 'next/cache'

// Shared data is cached on the server for CACHE_SECONDS so every visitor reads the
// same copy instead of each one calling the backend. Acknowledgements stay live.
const CACHE_SECONDS = 120

const API_VERSION = '3.23'

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

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') { inQuotes = !inQuotes }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = '' }
    else { current += char }
  }
  result.push(current.trim())
  return result
}

async function getToken(): Promise<{ token: string; siteId: string }> {
  const res = await fetch(
    `${process.env.TABLEAU_HOST}/api/${API_VERSION}/auth/signin`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        credentials: {
          personalAccessTokenName: process.env.TABLEAU_PAT_NAME,
          personalAccessTokenSecret: process.env.TABLEAU_PAT_SECRET,
          site: { contentUrl: process.env.TABLEAU_SITE_CONTENT_URL },
        },
      }),
    }
  )
  const data = await res.json()
  if (!data.credentials) throw new Error(`Signin failed: ${JSON.stringify(data)}`)
  return { token: data.credentials.token, siteId: data.credentials.site.id }
}

function toNum(v?: string): number | null {
  const s = (v ?? '').replace(/[$,]/g, '').trim()
  return s !== '' && s !== '-' ? parseFloat(s) : null
}

function toIsoDate(d: string): string {
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? d : dt.toISOString().slice(0, 10)
}

async function fetchReportRowsUncached(): Promise<ReportCompRow[]> {
  const { token, siteId } = await getToken()

  const tableauRes = await fetch(
    `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${process.env.TABLEAU_REPORT_COMPS_VIEW_ID}/data?pageSize=10000`,
    { headers: { 'X-Tableau-Auth': token }, cache: 'no-store' }
  )

  if (!tableauRes.ok) throw new Error(`Tableau returned ${tableauRes.status}: ${await tableauRes.text()}`)

  const csv = await tableauRes.text()
  const allLines = csv.trim().split('\n').filter(l => l.trim())

  if (allLines.length === 0) {
    console.log('[Report Comps] Tableau returned no data')
    return []
  }

  // Read columns by header name so column order changes in Tableau won't break parsing
  const headers = parseCSVLine(allLines[0])
  const idx = (name: string) => headers.indexOf(name)
  const iEnt = idx('Enterprise')
  const iGame = idx('Game Type')
  const iMkt = idx('Market')
  const iDate = idx('Month, Day, Year of Date')
  const iSys = idx('System')
  const iName = idx('Measure Names')
  const iVal = idx('Measure Values')

  // Pivot Measure Names/Values (one CSV row per measure) into one row per report
  const grouped = new Map<string, ReportCompRow>()
  for (const line of allLines.slice(1)) {
    const c = parseCSVLine(line)
    const date = c[iDate] ?? ''
    if (!date) continue

    const enterprise = c[iEnt] ?? ''
    const gameType = c[iGame] ?? ''
    const market = c[iMkt] ?? ''
    const system = c[iSys] ?? ''

    // Same format as the old Ack Row ID so existing acknowledgements still match
    const ackRowId = `${toIsoDate(date)}-${market}-${enterprise}-${system}-${gameType}`

    if (!grouped.has(ackRowId)) {
      grouped.set(ackRowId, {
        ackRowId, date, market, enterprise, system, gameType,
        handleVariance: null, sysHandle: null, dwHandle: null,
      })
    }

    const row = grouped.get(ackRowId)!
    const value = toNum(c[iVal])
    const m = (c[iName] ?? '').toLowerCase()
    if (m.includes('variance')) row.handleVariance = value
    else if (m.includes('dw')) row.dwHandle = value
    else if (m.includes('sys')) row.sysHandle = value
  }

  const rows = Array.from(grouped.values())
  console.log('[Report Comps] rows after pivot:', rows.length)
  return rows
}

const fetchReportRowsCached = unstable_cache(fetchReportRowsUncached, ['report-comps'], { revalidate: CACHE_SECONDS })

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
}> {
  const [rows, acknowledged] = await Promise.all([
    fetchReportRowsCached(),
    fetchAcknowledgedReportComps().catch(() => [] as AcknowledgedReportComp[]),
  ])
  return { rows, acknowledged }
}