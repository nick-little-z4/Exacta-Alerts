import Link from 'next/link'
import { fetchMachineCounts } from '@/lib/fetchMachineCounts'
import MapViewer from './MapViewer'

export const revalidate = 300

const API_VERSION = '3.23'

async function getMapImage(): Promise<string> {
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
  if (!signinData.credentials) throw new Error(`Signin failed`)
  const token = signinData.credentials.token
  const siteId = signinData.credentials.site.id

  const viewLuid = process.env.TABLEAU_MAP_VIEW_ID
  if (!viewLuid) throw new Error('TABLEAU_MAP_VIEW_ID is not set')

  const imgRes = await fetch(
    `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/views/${viewLuid}/image?resolution=high`,
    { headers: { 'X-Tableau-Auth': token } }
  )

  if (!imgRes.ok) {
    const detail = await imgRes.text()
    throw new Error(`Image fetch failed: ${imgRes.status} — ${detail}`)
  }

  const buffer = await imgRes.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  return `data:image/png;base64,${base64}`
}

export default async function ExactaMapPage() {
  let imageSrc: string | null = null
  let error: string | null = null

  const { rows } = await fetchMachineCounts()

  const marketMap = new Map<string, typeof rows>()
  for (const row of rows) {
    if (!marketMap.has(row.market)) marketMap.set(row.market, [])
    marketMap.get(row.market)!.push(row)
  }

  const totalFacilities = rows.length
  const totalMarkets = marketMap.size
  const totalMachines = rows.reduce((sum, r) => sum + (r.counts[r.counts.length - 1] ?? 0), 0)

  try {
    imageSrc = await getMapImage()
  } catch (err) {
    error = String(err)
  }

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-7xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🗺️</span>
              <h1 className="text-2xl font-bold text-white">Exacta Map</h1>
            </div>
            <p className="text-slate-400 text-sm mt-2">
              Geographic overview of all Exacta properties.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Machines (Latest Month)', value: totalMachines.toLocaleString() },
            { label: 'Facilities', value: totalFacilities },
            { label: 'Markets', value: totalMarkets },
          ].map(card => (
            <div key={card.label} className="bg-[#13152a] border border-slate-800 rounded-lg p-5">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{card.label}</div>
              <div className="text-3xl font-bold text-white">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Map */}
        {error ? (
          <div className="bg-rose-950 border border-rose-800 rounded-lg p-6 text-rose-300">
            Failed to load map: {error}
          </div>
        ) : imageSrc ? (
          <MapViewer src={imageSrc} />
        ) : null}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Exacta Map
        </footer>
      </div>
    </div>
  )
}