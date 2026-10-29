const API_VERSION = '3.23'

export interface RouletteDataPoint {
  date: string
  site: string
  seedPct: number
}

export interface RoulettePoolData {
  points: RouletteDataPoint[]
  sites: string[]
  dates: string[]
  lastRefreshed: string | null
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

async function getLastRefreshTime(token: string, siteId: string): Promise<string | null> {
  try {
    const headers = { 'X-Tableau-Auth': token, 'Accept': 'application/json' }
    const viewRes = await fetch(
      `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${process.env.TABLEAU_ROULETTE_POOL_VIEW_ID}`,
      { headers }
    )
    if (!viewRes.ok) return null
    const workbookId = (await viewRes.json()).view?.workbook?.id
    if (!workbookId) return null

    const wbRes = await fetch(
      `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/workbooks/${workbookId}`,
      { headers }
    )
    if (!wbRes.ok) return null
    return (await wbRes.json()).workbook?.updatedAt ?? null
  } catch {
    return null
  }
}

export async function fetchRoulettePool(): Promise<RoulettePoolData> {
  const { token, siteId } = await getToken()

  const [res, lastRefreshed] = await Promise.all([
    fetch(
      `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${process.env.TABLEAU_ROULETTE_POOL_VIEW_ID}/data?pageSize=10000`,
      { headers: { 'X-Tableau-Auth': token } }
    ),
    getLastRefreshTime(token, siteId),
  ])

  if (!res.ok) throw new Error(`Tableau returned ${res.status}: ${await res.text()}`)

  const csv = await res.text()
  const lines = csv.trim().split('\n').filter(l => l.trim())

  if (lines.length < 2) return { points: [], sites: [], dates: [], lastRefreshed }

  // Parse header to find column indices dynamically
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
  console.log('[fetchRoulettePool] headers:', headers)

  // Find site, date, and seed% columns flexibly
  const siteIdx = headers.findIndex(h => h.includes('site') || h.includes('market') || h.includes('location'))
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('week') || h.includes('month'))
  const seedIdx = headers.findIndex(h => h.includes('seed') || h.includes('pct') || h.includes('%') || h.includes('percent'))

  console.log('[fetchRoulettePool] col indices — site:', siteIdx, 'date:', dateIdx, 'seed:', seedIdx)

  const points: RouletteDataPoint[] = []
  const siteSet = new Set<string>()
  const dateSet = new Set<string>()
  let percentSignSeen = false

  for (const line of lines.slice(1)) {
    const cols = parseCSVLine(line)
    if (cols.length < 2) continue

    const site = siteIdx >= 0 ? cols[siteIdx]?.trim() : cols[0]?.trim()
    const date = dateIdx >= 0 ? cols[dateIdx]?.trim() : cols[1]?.trim()
    const rawSeed = seedIdx >= 0 ? cols[seedIdx]?.trim() : cols[2]?.trim()

    if (!site || !date || !rawSeed) continue

    // Parse percentage. Handles "100.02%", "1.0002" or "100.02"
    const hasPercentSign = rawSeed.includes('%')
    const seedPct = parseFloat(rawSeed.replace('%', '').replace(/,/g, ''))
    if (!isNaN(seedPct)) {
      points.push({ site, date, seedPct })
      if (hasPercentSign) percentSignSeen = true
      siteSet.add(site)
      dateSet.add(date)
    }
  }

  // Decide the scale once for the whole dataset instead of per value.
  // The old per-value check (<= 1 means decimal) left 1.0002 (100.02%) as 1%.
  // If no "%" was present and every value is small, the view sends fractions.
  if (!percentSignSeen && points.length > 0 && points.every(p => Math.abs(p.seedPct) <= 5)) {
    for (const p of points) p.seedPct = p.seedPct * 100
  }

  // Sort dates chronologically
  const dates = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  console.log('[fetchRoulettePool] parsed points:', points.length, 'sites:', siteSet.size)

  return {
    points,
    sites: Array.from(siteSet).sort(),
    dates,
    lastRefreshed,
  }
}