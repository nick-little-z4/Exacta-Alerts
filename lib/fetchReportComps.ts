const API_VERSION = '3.23'

export interface ReportCompRow {
  ackRowId: string
  date: string
  market: string
  enterprise: string
  system: string
  gameType: string
  handleVariance: number | null
}

export interface AcknowledgedReportComp {
  ack_row_id: string
  acknowledged_at?: string
  acknowledged_by?: string
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

export async function fetchReportComps(): Promise<{
  rows: ReportCompRow[]
  acknowledged: AcknowledgedReportComp[]
}> {
  const { token, siteId } = await getToken()

  const [tableauRes, acknowledgedRes] = await Promise.all([
    fetch(
      `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${process.env.TABLEAU_REPORT_COMPS_VIEW_ID}/data?pageSize=10000`,
      { headers: { 'X-Tableau-Auth': token } }
    ),
    fetch(
      `${process.env.AWS_API_GATEWAY_BASE_URL}/report-comps/acknowledged`,
      {
        headers: { 'x-api-key': process.env.AWS_API_KEY! },
        cache: 'no-store',
      }
    ),
  ])

  if (!tableauRes.ok) throw new Error(`Tableau returned ${tableauRes.status}: ${await tableauRes.text()}`)

  const csv = await tableauRes.text()
  const lines = csv.trim().split('\n').slice(1).filter(l => l.trim())
  console.log('Report Comps CSV rows:', lines.length)

  const rows: ReportCompRow[] = []
  let lastDate = ''

  for (const line of lines) {
    const cols = parseCSVLine(line)

    const rawDate = cols[5]?.trim() ?? ''
    if (rawDate !== '') lastDate = rawDate
    const date = lastDate

    const rawVariance = cols[7]?.replace(/[$,]/g, '').trim() ?? ''
    const handleVariance = rawVariance !== '' && rawVariance !== '-' ? parseFloat(rawVariance) : null

    rows.push({
      ackRowId: cols[1]?.trim() ?? '',
      date,
      market: cols[4]?.trim() ?? '',
      enterprise: cols[2]?.trim() ?? '',
      system: cols[6]?.trim() ?? '',
      gameType: cols[3]?.trim() ?? '',
      handleVariance,
    })
  }

  // Parse acknowledged rows
  let acknowledged: AcknowledgedReportComp[] = []
  if (acknowledgedRes.ok) {
    const ackData = await acknowledgedRes.json()
    const ackBody = typeof ackData.body === 'string' ? JSON.parse(ackData.body) : ackData
    acknowledged = ackBody.acknowledged ?? []
  }

  return {
    rows: rows.filter(r => r.date !== ''),
    acknowledged,
  }
}