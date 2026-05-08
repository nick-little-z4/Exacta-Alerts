const API_VERSION = '3.23'

export interface MachineRow {
  market: string
  enterprise: string
  facility: string
  counts: (number | null)[]
}

export interface MachineCountsData {
  rows: MachineRow[]
  months: string[] // e.g. ['October 2025', 'November 2025', ...]
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

export async function fetchMachineCounts(): Promise<MachineCountsData> {
  const { token, siteId } = await getToken()

  const res = await fetch(
    `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${process.env.TABLEAU_MACHINE_COUNT_VIEW_ID}/data?pageSize=10000`,
    { headers: { 'X-Tableau-Auth': token } }
  )

  if (!res.ok) throw new Error(`Tableau returned ${res.status}: ${await res.text()}`)

  const csv = await res.text()
  const lines = csv.trim().split('\n').slice(1).filter(l => l.trim())
  console.log('Total CSV rows from Tableau:', lines.length)

  // First pass — collect every unique month string from column 4
  const monthSet = new Set<string>()
  for (const line of lines) {
    const cols = parseCSVLine(line)
    if (cols.length >= 5 && cols[4]) monthSet.add(cols[4])
  }

  // Sort chronologically by parsing "Month YYYY"
  const sortedMonths = Array.from(monthSet).sort(
    (a, b) => new Date(`1 ${a}`).getTime() - new Date(`1 ${b}`).getTime()
  )

  // Map each month name to its column index
  const monthIndex: Record<string, number> = {}
  sortedMonths.forEach((m, i) => { monthIndex[m] = i })

  // Second pass — build facility rows
  const facilityMap = new Map<string, MachineRow>()
  for (const line of lines) {
    const cols = parseCSVLine(line)
    if (cols.length < 6) continue
    const enterprise = cols[0], facility = cols[1], market = cols[2]
    const monthYear = cols[4]
    const count = parseInt(cols[5].replace(/,/g, ''), 10)
    const key = `${market}|||${enterprise}|||${facility}`
    if (!facilityMap.has(key)) {
      facilityMap.set(key, {
        enterprise,
        facility,
        market,
        counts: Array(sortedMonths.length).fill(null),
      })
    }
    const idx = monthIndex[monthYear]
    if (idx !== undefined && !isNaN(count)) {
      facilityMap.get(key)!.counts[idx] = count
    }
  }

  return {
    rows: Array.from(facilityMap.values()),
    months: sortedMonths,
  }
}