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

async function getLastRefreshTime(token: string, siteId: string): Promise<string | null> {
  try {
    const headers = { 'X-Tableau-Auth': token, 'Accept': 'application/json' }
    const viewRes = await fetch(
      `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${process.env.TABLEAU_MACHINE_COUNT_VIEW_ID}`,
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

export async function fetchMachineCounts(): Promise<MachineCountsData> {
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
  if (allLines.length === 0) return { rows: [], months: ['Current'], lastRefreshed }

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

    const raw = parseFloat((c[iVal] ?? '').replace(/,/g, ''))
    const count = isNaN(raw) ? null : Math.round(raw)

    const existing = latest.get(site)
    if (!existing || time > existing.time) {
      latest.set(site, {
        time,
        row: { enterprise, facility: site, site, market, counts: [count] },
      })
    }
  }

  const rows = Array.from(latest.values()).map(v => v.row)

  return {
    rows,
    months: ['Current'],
    lastRefreshed,
  }
}