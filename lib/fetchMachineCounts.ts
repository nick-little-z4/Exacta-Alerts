import { unstable_cache } from 'next/cache'

// Shared data is cached on the server for CACHE_SECONDS so every visitor reads the
// same copy instead of each one calling the backend. Acknowledgements stay live.
const CACHE_SECONDS = 120

const API_VERSION = '3.23'

export interface MachineRow {
  market: string
  enterprise: string
  facility: string
  site: string
  counts: (number | null)[]
}

export interface MachineCountsData {
  rows: MachineRow[]
  months: string[]
  lastRefreshed: string | null
  /** Newest Date in the data (YYYY-MM-DD), i.e. "data through" */
  dataThrough: string | null
}

const SITE_TO_MARKET: Record<string, string> = {
  // AL
  BRC: 'AL', PAL: 'AL', MGR: 'AL', VLC: 'AL',
  // KS
  GIL: 'KS',
  // KY
  ASH: 'KY', BG: 'KY', CCG: 'KY', CB: 'KY', TUG: 'KY', KYD: 'KY',
  EP: 'KY', KRM: 'KY', DCD: 'KY', DCG: 'KY', NPT: 'KY', OGG: 'KY', OWG: 'KY', WB: 'KY',
  // MLT
  '6398': 'MLT', '6388': 'MLT', '6018': 'MLT', '7135': 'MLT', '6404': 'MLT',
  '6402': 'MLT', '6408': 'MLT', '1089': 'MLT', '6414': 'MLT', '7035': 'MLT',
  '1355': 'MLT', '7013': 'MLT', '7010': 'MLT', '6171': 'MLT', '1173': 'MLT', '6417': 'MLT',
  'IZI-MT': 'MLT',
  // MP
  'MPG-ERM': 'MP',
  // NH
  CWY: 'NH', DVR: 'NH', ACE: 'NH', OG: 'NH', KEN: 'NH', LEB: 'NH',
  MCT: 'NH', NSH: 'NH', DNN: 'NH', LCC: 'NH', SAL: 'NH', BRK: 'NH',
  // VA
  CV: 'VA', DU: 'VA', RSE: 'VA', EM: 'VA', HA: 'VA', CD: 'VA',
  HP5: 'VA', RI: 'VA', VI: 'VA',
  // WY
  BUF: 'WY', MI: 'WY', ML: 'WY', KC: 'WY', PW: 'WY', CWC: 'WY', CGW: 'WY',
  PR: 'WY', CA: 'WY', PP: 'WY', COL: 'WY', RR: 'WY', CC: 'WY', CH: 'WY',
  SR: 'WY', CDR: 'WY', CPL: 'WY', TBR: 'WY', DUG: 'WY', RH: 'WY',
  EHD: 'WY', EV: 'WY', EG: 'WY', EMR: 'WY', BH: 'WY', GI: 'WY', GT: 'WY',
  G59: 'WY', GWO: 'WY', GR: 'WY', TBG: 'WY', GU: 'WY', LR: 'WY', MBC: 'WY',
  TF: 'WY', SG: 'WY', RSF: 'WY', HH: 'WY', RS: 'WY', LG: 'WY', SCA: 'WY',
  SHR: 'WY', SH: 'WY', TR: 'WY',
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

/**
 * When the data was last refreshed in Tableau.
 *
 * workbook.updatedAt (REST) only changes when someone republishes the workbook,
 * and a data source's updatedAt doesn't change on extract refresh either. The
 * Metadata API exposes the real extract refresh time (extractLastRefreshTime),
 * for both embedded extracts and published data sources, so read that.
 * Falls back to workbook.updatedAt if the Metadata API gives nothing.
 */
async function getLastRefreshTime(token: string, siteId: string): Promise<string | null> {
  const base = `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}`
  const headers = { 'X-Tableau-Auth': token, 'Accept': 'application/json' }

  let workbookId: string | null = null
  let workbookUpdated: string | null = null
  try {
    const viewRes = await fetch(`${base}/views/${process.env.TABLEAU_MACHINE_COUNT_VIEW_ID}`, { headers })
    if (!viewRes.ok) return null
    workbookId = (await viewRes.json()).view?.workbook?.id ?? null
    if (!workbookId) return null
    const wbRes = await fetch(`${base}/workbooks/${workbookId}`, { headers })
    if (wbRes.ok) workbookUpdated = (await wbRes.json()).workbook?.updatedAt ?? null
  } catch (err) {
    console.log('[fetchMachineCounts] workbook lookup failed:', err)
    return null
  }

  try {
    const query = `{
      workbooks(filter: { luid: "${workbookId}" }) {
        name
        embeddedDatasources {
          name
          hasExtracts
          extractLastRefreshTime
          upstreamDatasources { name hasExtracts extractLastRefreshTime }
        }
      }
    }`
    const res = await fetch(`${process.env.TABLEAU_HOST}/api/metadata/graphql`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!res.ok) {
      console.log('[fetchMachineCounts] metadata API returned', res.status)
    } else {
      const json = await res.json()
      if (json.errors) console.log('[fetchMachineCounts] metadata API errors:', JSON.stringify(json.errors))
      type Ds = { name?: string; extractLastRefreshTime?: string | null; upstreamDatasources?: Ds[] }
      const embedded: Ds[] = json.data?.workbooks?.[0]?.embeddedDatasources ?? []
      const times: string[] = []
      for (const ds of embedded) {
        if (ds.extractLastRefreshTime) times.push(ds.extractLastRefreshTime)
        for (const up of ds.upstreamDatasources ?? []) {
          if (up.extractLastRefreshTime) times.push(up.extractLastRefreshTime)
        }
      }
      const newest = times.sort().pop() ?? null
      console.log('[fetchMachineCounts] extract refresh times:', JSON.stringify(
        embedded.map(d => ({
          name: d.name,
          refreshed: d.extractLastRefreshTime ?? null,
          upstream: (d.upstreamDatasources ?? []).map(u => ({ name: u.name, refreshed: u.extractLastRefreshTime ?? null })),
        }))
      ))
      if (newest) return newest
    }
  } catch (err) {
    console.log('[fetchMachineCounts] metadata lookup failed:', err)
  }

  return workbookUpdated
}

/** Skips the cache: used by the page's Refresh button. */
export async function fetchMachineCountsUncached(): Promise<MachineCountsData> {
  const { token, siteId } = await getToken()

  const [dataRes, lastRefreshed] = await Promise.all([
    fetch(
      `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${process.env.TABLEAU_MACHINE_COUNT_VIEW_ID}/data?pageSize=10000`,
      { headers: { 'X-Tableau-Auth': token } }
    ),
    getLastRefreshTime(token, siteId),
  ])

  if (!dataRes.ok) throw new Error(`Tableau returned ${dataRes.status}: ${await dataRes.text()}`)

  const csv = await dataRes.text()
  const allLines = csv.trim().split('\n').filter(l => l.trim())
  if (allLines.length === 0) return { rows: [], months: ['Current'], lastRefreshed, dataThrough: null }

  // Columns (by name): Country, Date, Enterprise, Location, Market, Machine Days
  const headers = parseCSVLine(allLines[0])
  const idx = (name: string) => headers.indexOf(name)
  const iDate = idx('Date'), iEnt = idx('Enterprise'), iLoc = idx('Location')
  const iMkt = idx('Market'), iVal = idx('Machine Days')

  // Keep each site's most recent day. Skip Tableau total rows (Date = "All").
  const latest = new Map<string, { time: number; row: MachineRow }>()

  for (const line of allLines.slice(1)) {
    const c = parseCSVLine(line)
    const site = c[iLoc] ?? ''
    const enterprise = c[iEnt] ?? ''
    const dateStr = c[iDate] ?? ''
    if (!site || site === 'Unknown' || !enterprise) continue
    if (!dateStr || dateStr.toLowerCase() === 'all') continue

    const time = new Date(dateStr).getTime()
    if (isNaN(time)) continue

    const market = c[iMkt] || SITE_TO_MARKET[site]
    if (!market) continue

    // Keep the exact value; pages round only the totals they display
    const raw = parseFloat((c[iVal] ?? '').replace(/,/g, ''))
    const count = isNaN(raw) ? null : raw

    // A site can have several rows on the same day (e.g. split by enterprise),
    // so add those together instead of keeping just one
    const existing = latest.get(site)
    if (!existing || time > existing.time) {
      latest.set(site, {
        time,
        row: { enterprise, facility: site, site, market, counts: [count] },
      })
    } else if (time === existing.time && count !== null) {
      existing.row.counts[0] = (existing.row.counts[0] ?? 0) + count
    }
  }

  const rows = Array.from(latest.values()).map(v => v.row)

  const newestTime = Math.max(...Array.from(latest.values()).map(v => v.time))
  const dataThrough = isFinite(newestTime) ? new Date(newestTime).toISOString().slice(0, 10) : null

  return {
    rows,
    months: ['Current'],
    lastRefreshed,
    dataThrough,
  }
}
export const fetchMachineCounts = unstable_cache(fetchMachineCountsUncached, ['machine-counts'], { revalidate: CACHE_SECONDS })