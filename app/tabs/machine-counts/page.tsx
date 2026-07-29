import React from 'react'
import Link from 'next/link'
import { fetchMachineCounts, MachineRow } from '@/lib/fetchMachineCounts'

export const dynamic = 'force-dynamic'

interface MarketGroup {
  market: string
  facilities: MachineRow[]
}

const MARKET_COLORS: Record<string, string> = {
  AL: '#4a6fa5', KY: '#e07b39', VA: '#e8b84b', WY: '#9b59b6',
  NH: '#27ae60', KS: '#e74c3c', MLT: '#16a085', MP: '#2c3e50',
}

const SVG_W = 960
const SVG_H = 500
const BOUNDS = { west: -125, east: 45, north: 55, south: -35 }

function project(lat: number, lng: number) {
  const lngC = Math.max(BOUNDS.west, Math.min(BOUNDS.east, lng))
  const latC = Math.max(BOUNDS.south, Math.min(BOUNDS.north, lat))
  const x = ((lngC - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * SVG_W
  const latR = (latC * Math.PI) / 180
  const northR = (BOUNDS.north * Math.PI) / 180
  const southR = (BOUNDS.south * Math.PI) / 180
  const mercN = Math.log(Math.tan(Math.PI / 4 + latR / 2))
  const mercNorth = Math.log(Math.tan(Math.PI / 4 + northR / 2))
  const mercSouth = Math.log(Math.tan(Math.PI / 4 + southR / 2))
  const y = ((mercNorth - mercN) / (mercNorth - mercSouth)) * SVG_H
  return { x, y }
}

// Approximate center coordinates per market
const MARKET_COORDS: Record<string, { lat: number; lng: number }> = {
  AL: { lat: 32.8, lng: -86.8 },
  KS: { lat: 37.8, lng: -97.3 },
  KY: { lat: 37.8, lng: -85.5 },
  MLT: { lat: 35.9, lng: 14.4 },
  MP: { lat: -26.5, lng: 29.9 },
  NH: { lat: 43.2, lng: -71.5 },
  VA: { lat: 37.4, lng: -77.5 },
  WY: { lat: 42.9, lng: -106.3 },
}

const MAP_PATHS = [
  { name: "Belgium", d: "M725,29L729,30L734,28L738,32L741,34L740,39L738,43L733,40L730,40L726,37L724,34L721,34L720,31L725,29Z" },
  { name: "Canada", d: "M346,65L350,66L356,66L353,68L351,69L344,66L342,64L344,61L346,65ZM357,46L354,47L347,44L342,41L343,40L351,42L357,45L357,46ZM8,51L6,52L0,48L0,46L0,43L0,40L0,36L0,36L0,37L0,37L0,40L0,44L6,47L8,51ZM389,35L385,41L389,39L393,40L391,43L396,45L398,43L404,45L402,51L406,49L407,53L409,58L406,64L404,64L400,63L401,57L393,62L390,62L394,59L388,57L382,58L371,57L374,53L371,51L376,46L382,34L385,30L390,27L393,28L389,35ZM195,0L202,0L209,0L213,0L219,0L223,0L231,0L239,0L247,0L243,0L247,0L246,0L235,0L227,0L222,0L220,0L214,0L213,0L206,0L198,0L194,0L193,0L187,0L180,0L174,0L172,0L171,0L179,0L182,0L185,0L193,0L203,0L209,0L213,0L220,0L226,0L235,0L241,0L240,6L242,14L246,23L255,31L259,28L262,20L259,7L255,3L264,0L271,0L274,0L273,0L269,0L262,0L269,0L267,0L265,0L269,0L278,0L284,0L289,0L294,0L301,0L303,0L313,0L315,0L320,0L324,0L332,0L337,0L341,0L346,0L353,0L359,0L357,0L364,0L369,0L378,0L382,3L384,10L389,11L391,14L391,23L387,26L383,29L374,32L367,38L357,39L345,38L337,37L331,38L326,43L319,47L311,56L304,63L309,62L318,52L330,46L339,45L344,49L338,54L340,62L342,67L349,70L358,69L364,62L365,67L368,69L361,74L349,78L343,80L337,85L332,85L332,79L342,73L333,74L327,75L323,71L323,61L321,59L317,60L315,58L311,64L309,69L307,72L304,73L303,74L292,75L283,75L281,77L275,82L272,85L267,85L261,85L259,86L260,89L253,93L247,94L240,98L237,97L238,93L240,89L242,85L241,79L240,73L234,70L234,68L231,67L228,66L227,62L222,60L218,58L212,55L207,52L202,54L200,54L193,52L188,53L183,51L177,50L173,50L171,48L170,44L169,44L169,47L157,47L138,47L118,47L101,47L84,47L68,47L51,47L45,47L28,47L12,47L1,40L0,37L0,33L0,27L0,22L0,18L0,12L0,6L0,2L0,0L3,0L11,0L20,0L29,0L42,0L50,0L65,0L80,0L91,0L102,0L117,0L133,0L150,0L163,0L171,0L174,0L168,0L176,0L184,0L195,0Z" },
  { name: "Germany", d: "M762,0L762,3L768,5L768,8L773,7L777,4L783,8L786,10L787,14L787,19L789,24L788,26L791,31L788,32L785,33L781,34L779,36L775,38L777,43L779,45L783,48L781,51L779,52L779,57L777,57L774,57L770,58L765,58L762,57L760,58L754,56L748,57L749,52L752,47L743,46L741,44L741,40L741,34L740,26L743,26L745,23L746,15L745,13L751,10L756,8L754,5L754,0L758,1L762,0Z" },
  { name: "Spain", d: "M655,96L655,92L653,89L661,84L668,85L675,85L681,86L686,86L695,86L697,89L708,92L710,90L716,93L723,92L723,96L718,100L710,102L710,104L706,107L704,113L707,116L703,119L702,123L698,124L694,129L687,129L681,129L678,131L676,133L673,133L671,131L669,127L664,126L663,124L665,122L664,118L666,114L664,111L666,110L666,107L667,101L670,99L668,96L665,96L661,97L659,94L657,95L655,96Z" },
  { name: "France", d: "M726,37L730,40L733,40L738,43L741,44L743,46L752,47L749,52L748,57L744,58L740,64L740,67L743,66L745,69L746,73L744,75L745,81L749,81L748,84L743,88L732,86L723,88L723,92L716,93L710,90L708,92L697,89L695,86L698,82L699,69L693,61L689,58L681,55L680,49L687,48L697,50L695,41L700,45L713,39L715,33L720,31L721,34L724,34L726,37Z" },
  { name: "Ireland", d: "M671,9L672,15L668,22L658,27L650,26L654,18L651,9L659,3L663,0L664,3L663,8L667,8L671,9Z" },
  { name: "Italy", d: "M794,119L791,124L792,126L791,129L787,127L784,126L776,123L777,120L783,120L789,120L794,119ZM758,101L761,105L760,113L758,113L756,115L753,113L753,106L752,102L755,103L758,101ZM776,63L784,65L783,68L785,71L780,70L776,73L776,76L777,82L782,85L785,91L791,96L796,96L796,98L801,101L805,103L810,106L809,109L806,107L801,105L799,110L803,112L802,115L800,116L797,121L794,121L794,119L796,116L795,111L793,108L791,107L789,104L785,103L783,101L779,100L774,97L769,93L765,89L763,83L761,82L756,80L753,81L750,84L748,84L749,81L745,81L744,75L746,73L744,71L747,70L750,70L753,67L757,68L758,66L762,66L764,65L765,62L768,63L775,61L776,63Z" },
  { name: "Mexico", d: "M157,190L155,195L154,198L154,206L153,208L154,211L156,213L157,217L161,221L162,224L164,227L170,228L173,230L178,229L182,228L186,227L190,227L193,224L195,221L195,217L200,214L206,213L211,213L214,213L215,216L212,219L211,223L211,226L210,230L207,228L204,232L202,231L197,232L192,232L192,235L189,235L192,236L194,238L195,241L188,241L185,245L185,247L179,243L176,241L171,240L168,240L163,242L161,243L157,241L152,241L147,238L143,238L136,235L132,233L127,231L121,229L119,227L113,224L110,221L109,219L111,218L111,215L111,213L110,211L109,209L107,206L102,201L96,197L94,194L89,192L89,187L86,186L82,183L81,179L78,179L75,176L72,173L72,171L69,167L67,163L67,161L63,159L61,159L58,157L57,160L58,162L58,166L60,169L64,173L66,174L67,176L69,180L71,181L72,183L76,186L77,191L79,193L81,196L81,198L84,199L86,201L88,203L86,206L83,203L79,200L75,197L72,196L73,192L72,189L69,188L65,185L63,184L59,183L56,180L59,180L61,178L61,175L57,171L54,170L51,166L49,163L47,158L44,153L51,153L58,152L66,156L79,160L90,160L95,160L95,158L104,158L106,160L109,161L113,164L115,167L116,170L119,171L124,173L127,169L132,169L136,171L139,175L141,178L144,181L145,185L147,187L151,189L155,190L157,190Z" },
  { name: "Netherlands", d: "M740,12L745,13L746,15L745,23L743,26L740,26L741,34L738,32L734,28L729,30L725,29L728,27L732,16L740,12Z" },
  { name: "Portugal", d: "M655,96L657,95L659,94L661,97L664,97L668,96L670,99L667,101L667,106L666,110L664,111L666,114L664,118L666,120L663,124L664,126L662,128L659,127L656,128L656,123L656,119L653,119L652,116L653,112L655,110L655,107L656,103L656,101L655,98L655,96Z" },
  { name: "USA", d: "M170,44L171,48L173,50L177,50L183,51L188,53L193,52L200,54L202,54L207,52L212,55L218,58L222,60L227,62L228,65L231,65L232,68L235,69L240,73L241,79L242,85L240,89L238,93L236,95L239,98L247,94L253,93L260,90L260,87L261,85L267,85L272,85L274,82L281,77L283,75L292,75L302,75L304,73L307,72L309,69L311,64L315,58L317,60L321,59L323,61L323,71L327,75L328,77L322,80L316,82L310,84L307,88L306,93L308,97L310,97L310,95L311,96L307,99L304,99L300,100L298,100L294,101L290,102L298,101L292,104L288,104L287,110L283,115L281,113L279,111L281,115L282,118L280,121L277,125L278,121L275,119L275,114L274,116L275,120L271,119L275,121L275,127L277,129L278,135L275,140L269,142L265,145L262,145L259,148L259,149L252,153L249,156L247,159L246,163L247,167L249,172L251,176L251,178L254,185L254,188L253,190L252,194L247,194L247,191L244,190L241,185L239,181L238,179L239,175L238,172L233,168L231,167L225,169L222,167L218,165L212,166L207,165L202,166L200,166L201,170L201,172L199,171L197,172L193,172L188,169L184,170L179,169L176,169L171,170L166,174L160,177L157,179L156,182L156,186L156,188L157,190L155,190L151,189L147,187L145,185L144,181L141,178L139,175L136,171L132,169L127,169L124,173L119,171L116,170L115,167L113,164L109,161L106,160L104,158L95,158L95,160L90,160L79,160L66,156L58,153L51,153L44,153L44,150L40,147L37,146L33,144L31,143L26,142L24,138L19,132L14,123L12,120L7,115L6,110L3,106L5,101L4,95L3,90L5,84L6,78L6,72L5,63L3,56L2,53L11,54L14,61L14,53L12,47L28,47L45,47L51,47L68,47L84,47L101,47L118,47L138,47L157,47L169,47L169,44L170,44Z" },
  { name: "South Africa", d: "M884,467L880,471L879,474L876,478L869,484L865,487L861,490L855,492L852,492L848,493L845,494L839,493L836,494L833,493L828,496L823,497L819,499L817,499L814,497L812,497L810,494L809,490L807,486L809,485L809,481L805,475L802,471L798,463L801,461L803,462L804,465L807,465L810,466L813,466L818,463L818,443L823,449L823,452L824,454L828,453L831,451L833,449L835,447L838,446L840,446L843,448L847,448L851,447L851,445L852,443L855,442L857,440L859,437L864,433L872,429L874,429L877,430L879,429L882,430L885,437L886,441L885,447L886,449L883,448L881,450L879,452L879,453L883,456L886,456L887,453L891,453L890,457L889,462L888,464L884,467Z" },
]

interface MiniMapProps {
  groups: MarketGroup[]
}

function MiniMap({ groups }: MiniMapProps) {
  const marketTotals: Record<string, number> = {}
  for (const g of groups) {
    marketTotals[g.market] = g.facilities.reduce(
      (sum, f) => sum + (f.counts[f.counts.length - 1] ?? 0), 0
    )
  }
  const maxCount = Math.max(...Object.values(marketTotals))

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: '100%' }}>
      <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#1e3a5f" />
      {MAP_PATHS.map(({ name, d }) => (
        <path key={name} d={d} fill="#2d5a8e" stroke="#4a8bc4" strokeWidth="0.5" />
      ))}
      <circle cx={787} cy={133} r={4} fill="#2d5a8e" stroke="#4a8bc4" strokeWidth="0.5" />
      {Object.entries(MARKET_COORDS).map(([market, coords]) => {
        const { x, y } = project(coords.lat, coords.lng)
        const count = marketTotals[market] ?? 0
        if (!count) return null
        const color = MARKET_COLORS[market] ?? '#64748b'
        const r = Math.max(8, Math.min(28, Math.sqrt(count / maxCount) * 28))
        return (
          <g key={market}>
            <circle cx={x} cy={y} r={r} fill={color} opacity={0.85} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize="7" fontWeight="bold" style={{ pointerEvents: 'none' }}>
              {market}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default async function MachineCountsPage() {
  const { rows, lastRefreshed } = await fetchMachineCounts()
  const timestamp = lastRefreshed
    ? new Date(lastRefreshed).toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) + ' CDT'
    : 'Unknown'

  const marketMap = new Map<string, MachineRow[]>()
  for (const row of rows) {
    if (!marketMap.has(row.market)) marketMap.set(row.market, [])
    marketMap.get(row.market)!.push(row)
  }

  const groups: MarketGroup[] = Array.from(marketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([market, facilities]) => ({ market, facilities }))

  const totalMarkets = groups.length
  const totalMachines = rows.reduce((sum, r) => sum + (r.counts[r.counts.length - 1] ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-7xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors">
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🖥️</span>
              <h1 className="text-2xl font-bold text-white">Machine Counts</h1>
            </div>
          </div>
              <p className="text-slate-400 text-sm mt-3">Machine counts by market.</p>
              <div className="mt-4 flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 w-fit relative group cursor-help">
                <span className="text-slate-500 text-xs uppercase tracking-widest">Updated</span>
                <span className="text-slate-200 text-xs font-semibold">{timestamp}</span>
                <span className="absolute top-full left-0 mt-2 w-64 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case tracking-normal font-normal">
                  Last updated from Tableau Data Source.
                </span>
              </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {[
            { label: 'Total Machines', value: totalMachines.toLocaleString() },
            { label: 'Markets', value: totalMarkets },
          ].map(card => (
            <div key={card.label} className="bg-[#13152a] border border-slate-800 rounded-lg p-5">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{card.label}</div>
              <div className="text-3xl font-bold text-white">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Map + Table side by side */}
        <div className="flex gap-6 items-start">

          {/* Mini SVG Map */}
          <div className="w-[600px] shrink-0 bg-[#13152a] border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Markets Overview</span>
            </div>
            <div style={{ height: '312px' }}>
              <MiniMap groups={groups} />
            </div>
          </div>

          {/* Market Table */}
          <div className="flex-1 bg-[#13152a] border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Machines
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => {
                  const total = group.facilities.reduce(
                    (sum, f) => sum + (f.counts[f.counts.length - 1] ?? 0), 0
                  )
                  return (
                    <tr key={group.market} className="border-t border-slate-800 hover:bg-[#1a1d35] transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-orange-400 uppercase tracking-widest text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: MARKET_COLORS[group.market] ?? '#64748b' }} />
                          {group.market}
                        </div>
                      </td>
                      <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">
                        {total > 0 ? total.toLocaleString() : '—'}
                      </td>
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-slate-600 bg-[#0a0b14]">
                  <td className="px-4 py-3 font-bold text-white">Grand Total</td>
                  <td className="text-right px-4 py-3 font-bold text-white tabular-nums">
                    {totalMachines.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Machine Counts
        </footer>
      </div>
    </div>
  )
}