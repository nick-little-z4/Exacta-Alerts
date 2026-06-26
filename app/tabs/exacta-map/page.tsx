import Link from 'next/link'
import { fetchMachineCounts } from '@/lib/fetchMachineCounts'
import MapViewer, { MapFacility } from './MapViewer'

export const dynamic = 'force-dynamic'

const SITE_COORDS: Record<string, { lat: number; lng: number }> = {
  // AL
  BRC: { lat: 33.5779, lng: -86.6850 },
  PAL: { lat: 32.9988, lng: -87.7930 },
  MGR: { lat: 30.6954, lng: -88.1430 },
  VLC: { lat: 32.4071, lng: -85.9063 },
  // KS
  GIL: { lat: 37.8100, lng: -97.3270 },
  // KY
  ASH: { lat: 38.4784, lng: -82.6379 },
  BG:  { lat: 36.9685, lng: -86.4808 },
  CCG: { lat: 37.0334, lng: -88.3584 },
  CB:  { lat: 36.9498, lng: -84.0988 },
  TUG: { lat: 38.9987, lng: -84.6266 },
  KYD: { lat: 36.7228, lng: -86.5772 },
  EP:  { lat: 37.8357, lng: -87.5901 },
  KRM: { lat: 38.0406, lng: -84.4580 },
  DCD: { lat: 38.2527, lng: -85.7585 },
  DCG: { lat: 38.1890, lng: -85.7401 },
  NPT: { lat: 39.0917, lng: -84.4947 },
  OGG: { lat: 36.8590, lng: -87.4358 },
  OWG: { lat: 37.7719, lng: -87.1112 },
  WB:  { lat: 36.7284, lng: -84.1596 },
  // MLT
  '6398': { lat: 35.8950, lng: 14.4617 },
  '6388': { lat: 35.8950, lng: 14.4617 },
  '6018': { lat: 36.0228, lng: 14.2619 },
  '7135': { lat: 35.8489, lng: 14.4449 },
  '6404': { lat: 35.8920, lng: 14.5210 },
  '6402': { lat: 35.9590, lng: 14.3627 },
  '6408': { lat: 35.8747, lng: 14.4979 },
  '1089': { lat: 35.8741, lng: 14.4726 },
  '6414': { lat: 35.8741, lng: 14.4726 },
  '7035': { lat: 35.9520, lng: 14.3960 },
  '1355': { lat: 35.9520, lng: 14.3960 },
  '7013': { lat: 35.9520, lng: 14.3960 },
  '7010': { lat: 35.9520, lng: 14.3960 },
  '6171': { lat: 35.9080, lng: 14.4750 },
  '1173': { lat: 35.8997, lng: 14.5148 },
  '6417': { lat: 36.0444, lng: 14.2395 },
  // MP
  'MPG-ERM': { lat: -26.5230, lng: 29.9885 },
  // NH
  CWY: { lat: 43.9770, lng: -71.1270 },
  DVR: { lat: 43.1979, lng: -70.8737 },
  ACE: { lat: 42.9298, lng: -70.8370 },
  OG:  { lat: 42.9298, lng: -70.8370 },
  KEN: { lat: 42.9270, lng: -72.2793 },
  LEB: { lat: 43.6423, lng: -72.2518 },
  MCT: { lat: 42.9956, lng: -71.4548 },
  NSH: { lat: 42.7654, lng: -71.4676 },
  DNN: { lat: 42.7654, lng: -71.4676 },
  LCC: { lat: 43.3042, lng: -70.9750 },
  SAL: { lat: 42.7879, lng: -71.2212 },
  BRK: { lat: 42.8959, lng: -70.8745 },
  // VA
  CV:  { lat: 36.7137, lng: -79.9139 },
  DU:  { lat: 38.5651, lng: -77.3244 },
  RSE: { lat: 38.5651, lng: -77.3244 },
  EM:  { lat: 36.6860, lng: -77.5411 },
  HA:  { lat: 37.0299, lng: -76.3452 },
  CD:  { lat: 37.5271, lng: -76.9935 },
  HP5: { lat: 37.5407, lng: -77.4360 },
  RI:  { lat: 37.5407, lng: -77.4360 },
  VI:  { lat: 37.2793, lng: -79.8939 },
  // WY
  BUF: { lat: 44.3480, lng: -106.7002 },
  MI:  { lat: 42.8501, lng: -106.3252 },
  ML:  { lat: 42.8501, lng: -106.3252 },
  KC:  { lat: 42.8501, lng: -106.3252 },
  PW:  { lat: 42.8501, lng: -106.3252 },
  CWC: { lat: 42.8501, lng: -106.3252 },
  CGW: { lat: 42.8501, lng: -106.3252 },
  PR:  { lat: 42.8501, lng: -106.3252 },
  CA:  { lat: 42.8501, lng: -106.3252 },
  PP:  { lat: 41.1400, lng: -104.8202 },
  COL: { lat: 41.1400, lng: -104.8202 },
  RR:  { lat: 41.1400, lng: -104.8202 },
  CC:  { lat: 41.1400, lng: -104.8202 },
  CH:  { lat: 41.1400, lng: -104.8202 },
  SR:  { lat: 41.1400, lng: -104.8202 },
  CDR: { lat: 41.1400, lng: -104.8202 },
  CPL: { lat: 41.1400, lng: -104.8202 },
  TBR: { lat: 41.1400, lng: -104.8202 },
  DUG: { lat: 42.7597, lng: -105.3822 },
  RH:  { lat: 42.7597, lng: -105.3822 },
  EHD: { lat: 41.2683, lng: -110.9633 },
  EV:  { lat: 41.2683, lng: -110.9633 },
  EG:  { lat: 41.2683, lng: -110.9633 },
  EMR: { lat: 41.2705, lng: -111.0190 },
  BH:  { lat: 44.2912, lng: -105.5011 },
  GI:  { lat: 44.2912, lng: -105.5011 },
  GT:  { lat: 44.2912, lng: -105.5011 },
  G59: { lat: 44.2912, lng: -105.5011 },
  GWO: { lat: 44.2912, lng: -105.5011 },
  GR:  { lat: 41.5250, lng: -109.4665 },
  TBG: { lat: 41.5250, lng: -109.4665 },
  GU:  { lat: 41.5250, lng: -109.4665 },
  LR:  { lat: 41.3114, lng: -105.5911 },
  MBC: { lat: 42.8501, lng: -106.3252 },
  TF:  { lat: 41.7911, lng: -107.2387 },
  SG:  { lat: 43.0247, lng: -108.3803 },
  RSF: { lat: 41.5875, lng: -109.2029 },
  HH:  { lat: 41.5875, lng: -109.2029 },
  RS:  { lat: 41.5875, lng: -109.2029 },
  LG:  { lat: 44.7972, lng: -106.9562 },
  SCA: { lat: 44.7972, lng: -106.9562 },
  SHR: { lat: 44.7972, lng: -106.9562 },
  SH:  { lat: 44.7972, lng: -106.9562 },
  TR:  { lat: 42.0633, lng: -104.1530 },
}

interface FacilityLookup {
  enterprise: string
  siteCode: string
  siteName: string
  city: string
  state: string
  country: string
}

async function getFacilityLookup(): Promise<FacilityLookup[]> {
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/exacta-maps`,
    {
      headers: { 'x-api-key': process.env.EXACTA_API_KEY ?? '' },
      cache: 'no-store',
    }
  )
  if (!res.ok) throw new Error(`Facility lookup failed: ${res.status}`)
  return res.json()
}

export default async function ExactaMapPage() {
  let facilities: MapFacility[] = []
  let error: string | null = null

  const { rows } = await fetchMachineCounts()
  const totalMachines = rows.reduce((sum, r) => sum + (r.counts[r.counts.length - 1] ?? 0), 0)
  const totalMarkets = new Set(rows.map(r => r.market).filter(Boolean)).size

  try {
    const lookup = await getFacilityLookup()

    // Build lookup by site code
    const lookupBySite: Record<string, FacilityLookup> = {}
    for (const f of lookup) {
      lookupBySite[f.siteCode] = f
    }

    // Inner join — only sites in both machine counts AND facility lookup AND with coords
    const joined = rows
      .filter(row => row.site && lookupBySite[row.site] && SITE_COORDS[row.site])
      .map(row => {
        const f = lookupBySite[row.site]
        return {
          enterprise: f.enterprise,
          siteCode: f.siteCode,
          siteName: f.siteName,
          city: f.city,
          state: f.state,
          country: f.country,
          market: f.state,
          lat: SITE_COORDS[row.site].lat,
          lng: SITE_COORDS[row.site].lng,
          machineCount: row.counts[row.counts.length - 1] ?? null,
        }
      })

    // Deduplicate by site code — keep highest machine count
    const siteMap = new Map<string, MapFacility>()
    for (const f of joined) {
      const existing = siteMap.get(f.siteCode)
      if (!existing || (f.machineCount ?? 0) > (existing.machineCount ?? 0)) {
        siteMap.set(f.siteCode, f)
      }
    }
    facilities = Array.from(siteMap.values())

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
            Geographic overview of all Exacta properties. Click a dot to explore.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#13152a] border border-slate-800 rounded-lg p-5">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Machines</div>
            <div className="text-3xl font-bold text-white">{totalMachines.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-1">Current count</div>
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