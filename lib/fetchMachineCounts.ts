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

export async function fetchMachineCounts(): Promise<MachineCountsData> {
  const { token, siteId } = await getToken()

  const res = await fetch(
    `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${process.env.TABLEAU_MACHINE_COUNT_VIEW_ID}/data?pageSize=10000`,
    { headers: { 'X-Tableau-Auth': token } }
  )

  if (!res.ok) throw new Error(`Tableau returned ${res.status}: ${await res.text()}`)

  const csv = await res.text()
  // Columns: Enterprise, Location (site code), Exacta Alerts Machine Count
  const lines = csv.trim().split('\n').slice(1).filter(l => l.trim())

  const rows: MachineRow[] = []

  for (const line of lines) {
    const cols = parseCSVLine(line)
    if (cols.length < 3) continue
    const enterprise = cols[0]
    const site = cols[1]
    const count = parseInt(cols[2].replace(/,/g, ''), 10)

    // Skip unknown/null sites
    if (!site || site === 'Unknown' || !enterprise) continue
    // Skip sites with no market mapping
    const market = SITE_TO_MARKET[site]
    if (!market) continue

    rows.push({
      enterprise,
      facility: site,
      site,
      market,
      counts: [isNaN(count) ? null : count],
    })
  }

  return {
    rows,
    months: ['Current'],
  }
}