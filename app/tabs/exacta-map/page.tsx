import Link from 'next/link'
import { fetchMachineCounts } from '@/lib/fetchMachineCounts'
import MapViewer, { FacilityRow } from './MapViewer'

export const dynamic = 'force-dynamic'

const API_VERSION = '3.23'

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

function parseMapCSV(csv: string): FacilityRow[] {
  const lines = csv.trim().split('\n').filter(l => l.trim())
  const facilities: FacilityRow[] = []
  for (const line of lines.slice(1)) {
    const cols = parseCSVLine(line)
    if (cols.length < 6) continue
    const city = cols[0]?.trim() ?? ''
    const country = cols[1]?.trim() ?? ''
    const market = cols[2]?.trim() ?? ''
    const rawCount = cols[3]?.replace(/[,$]/g, '').trim() ?? ''
    const lat = parseFloat(cols[4]?.trim() ?? '')
    const lng = parseFloat(cols[5]?.trim() ?? '')
    if (!city || isNaN(lat) || isNaN(lng)) continue
    facilities.push({ city, country, market, machineCount: rawCount ? parseInt(rawCount) : null, lat, lng })
  }
  return facilities
}

async function getFacilities(): Promise<FacilityRow[]> {
  const signinRes = await fetch(
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
  const signinData = await signinRes.json()
  if (!signinData.credentials) throw new Error('Signin failed')
  const token = signinData.credentials.token
  const siteId = signinData.credentials.site.id

  const csvRes = await fetch(
    `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${process.env.TABLEAU_MAP_VIEW_ID}/data?pageSize=10000`,
    { headers: { 'X-Tableau-Auth': token } }
  )

  if (!csvRes.ok) throw new Error(`CSV fetch failed: ${csvRes.status}`)
  const csv = await csvRes.text()
  return parseMapCSV(csv)
}

export default async function ExactaMapPage() {
  let facilities: FacilityRow[] = []
  let error: string | null = null

  const { rows } = await fetchMachineCounts()
  const totalMachines = rows.reduce((sum, r) => sum + (r.counts[r.counts.length - 1] ?? 0), 0)
  const totalMarkets = new Set(rows.map(r => r.market)).size

  try {
    facilities = await getFacilities()
  } catch (err) {
    error = String(err)
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-7xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors">
          ← Back to Dashboard
        </Link>

        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <h1 className="text-2xl font-bold text-white">Exacta Map</h1>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Geographic overview of all Exacta properties. Click a dot or city name to explore.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#13152a] border border-slate-800 rounded-lg p-5">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Machines</div>
            <div className="text-3xl font-bold text-white">{totalMachines.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Latest month</div>
          </div>
          <div className="bg-[#13152a] border border-slate-800 rounded-lg p-5">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Facilities</div>
            <div className="text-3xl font-bold text-white">{facilities.length}</div>
            <div className="text-xs text-slate-500 mt-1">Active locations</div>
          </div>
          <div className="bg-[#13152a] border border-slate-800 rounded-lg p-5">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Markets</div>
            <div className="text-3xl font-bold text-white">{totalMarkets}</div>
            <div className="text-xs text-slate-500 mt-1">Geographic regions</div>
          </div>
        </div>

        {error ? (
          <div className="bg-rose-950 border border-rose-800 rounded-lg p-6 text-rose-300">
            Failed to load map: {error}
          </div>
        ) : (
          <MapViewer facilities={facilities} />
        )}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Exacta Map
        </footer>
      </div>
    </div>
  )
}