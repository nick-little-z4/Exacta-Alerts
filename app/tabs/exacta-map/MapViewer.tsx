'use client'

import { useRef, useState, useEffect } from 'react'

export interface MapFacility {
  enterprise: string
  siteCode: string
  siteName: string
  city: string
  state: string
  country: string
  market: string
  lat: number
  lng: number
  machineCount: number | null
}

const SVG_W = 960
const SVG_H = 500
const BOUNDS = { west: -125, east: 45, north: 55, south: -35 }

function project(lat: number, lng: number): { x: number; y: number } {
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
  return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 }
}

// Offsets per site code to prevent stacking in same city
const SITE_OFFSETS: Record<string, { dlat: number; dlng: number }> = {
  // Casper WY (base: 42.8501, -106.3252)
  PR:  { dlat:  0.05, dlng:  0.00 },
  KC:  { dlat:  0.00, dlng:  0.08 },
  PW:  { dlat: -0.05, dlng:  0.00 },
  CA:  { dlat:  0.00, dlng: -0.08 },
  MI:  { dlat:  0.04, dlng:  0.06 },
  ML:  { dlat: -0.04, dlng:  0.06 },
  CWC: { dlat:  0.04, dlng: -0.06 },
  CGW: { dlat: -0.04, dlng: -0.06 },
  MBC: { dlat:  0.07, dlng:  0.03 },
  // Cheyenne WY (base: 41.1400, -104.8202)
  PP:  { dlat:  0.06, dlng:  0.00 },
  COL: { dlat:  0.03, dlng:  0.07 },
  RR:  { dlat: -0.03, dlng:  0.07 },
  CC:  { dlat: -0.06, dlng:  0.00 },
  CH:  { dlat: -0.03, dlng: -0.07 },
  SR:  { dlat:  0.03, dlng: -0.07 },
  CDR: { dlat:  0.07, dlng:  0.04 },
  CPL: { dlat: -0.07, dlng:  0.04 },
  TBR: { dlat:  0.00, dlng: -0.09 },
  // Gillette WY (base: 44.2912, -105.5011)
  BH:  { dlat:  0.05, dlng:  0.00 },
  GI:  { dlat:  0.00, dlng:  0.07 },
  GT:  { dlat: -0.05, dlng:  0.00 },
  G59: { dlat:  0.00, dlng: -0.07 },
  GWO: { dlat:  0.04, dlng:  0.05 },
  // Evanston WY (base: 41.2683, -110.9633)
  EHD: { dlat:  0.04, dlng:  0.00 },
  EV:  { dlat:  0.00, dlng:  0.05 },
  EG:  { dlat: -0.04, dlng:  0.00 },
  // Sheridan WY (base: 44.7972, -106.9562)
  LG:  { dlat:  0.04, dlng:  0.00 },
  SCA: { dlat:  0.00, dlng:  0.05 },
  SHR: { dlat: -0.04, dlng:  0.00 },
  SH:  { dlat:  0.00, dlng: -0.05 },
  // Rock Springs WY (base: 41.5875, -109.2029)
  RSF: { dlat:  0.04, dlng:  0.00 },
  HH:  { dlat:  0.00, dlng:  0.05 },
  RS:  { dlat: -0.04, dlng:  0.00 },
  // Green River WY (base: 41.5250, -109.4665)
  GR:  { dlat:  0.04, dlng:  0.00 },
  TBG: { dlat:  0.00, dlng:  0.05 },
  GU:  { dlat: -0.04, dlng:  0.00 },
  // Douglas WY (base: 42.7597, -105.3822)
  DUG: { dlat:  0.03, dlng:  0.00 },
  RH:  { dlat: -0.03, dlng:  0.00 },
  // Hampton NH — VA and NH
  OG:  { dlat:  0.00, dlng:  0.04 },
  HA:  { dlat:  0.00, dlng: -0.04 },
  // Nashua NH
  NSH: { dlat:  0.02, dlng:  0.00 },
  DNN: { dlat: -0.02, dlng:  0.00 },
  // Richmond VA
  HP5: { dlat:  0.02, dlng:  0.00 },
  RI:  { dlat: -0.02, dlng:  0.00 },
  // Dumfries VA
  DU:  { dlat:  0.02, dlng:  0.00 },
  RSE: { dlat: -0.02, dlng:  0.00 },
  // Louisville KY
  DCD: { dlat:  0.02, dlng:  0.00 },
  DCG: { dlat: -0.02, dlng:  0.00 },
  // Saint Paul's Bay MLT (multiple sites same coords)
  '7035': { dlat:  0.03, dlng:  0.00 },
  '1355': { dlat:  0.00, dlng:  0.03 },
  '7013': { dlat: -0.03, dlng:  0.00 },
  '7010': { dlat:  0.00, dlng: -0.03 },
  // Birkirkara MLT
  '6398': { dlat:  0.02, dlng:  0.00 },
  '6388': { dlat: -0.02, dlng:  0.00 },
  // Qormi MLT
  '6414': { dlat:  0.02, dlng:  0.00 },
  '1089': { dlat: -0.02, dlng:  0.00 },
}

const MAP_PATHS: { name: string; d: string }[] = [
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

const MARKET_COLORS: Record<string, string> = {
  AL: '#4a6fa5', KY: '#e07b39', VA: '#e8b84b', WY: '#9b59b6',
  NH: '#27ae60', KS: '#e74c3c', MLT: '#16a085', MP: '#2c3e50',
}



const SITE_HOURS: Record<string, string> = {
  ELS: '00:00', KYD: '05:00', BH: '04:00', BG: '05:00',
  GS: '05:00', OG: '05:00', WB: '05:00', DNN: '02:00',
  WYD: '04:00', NHG: '04:00', CB: '05:00', ACE: '04:00',
  ASH: '07:00', DCD: '05:00', RSE: '04:00', BRK: '04:00',
  EP: '06:00', LMN: '05:00', OGG: '05:00', DCG: '05:00',
  TUG: '05:00', NPT: '05:00', WHR: '03:00', 'IZI-MT': '05:00',
  HA: '06:00', KRM: '07:00', PAL: '08:00', RI: '06:00',
  CD: '06:00', DU: '06:00', EM: '05:00', VI: '06:00',
  GIL: '06:00', CCG: '05:00', NSH: '06:00', OWG: '05:00',
  HP5: '04:00', VLC: '08:00', GRD: '06:00', PCIR: '07:00',
}

const SITE_TIMEZONES: Record<string, string> = {
  CB: 'US/Eastern', KYD: 'US/Eastern', BG: 'US/Eastern',
  WB: 'US/Eastern', DNN: 'US/Eastern', NHG: 'US/Eastern',
  ACE: 'US/Eastern', ASH: 'US/Eastern', DCD: 'US/Eastern',
  RSE: 'US/Eastern', BRK: 'US/Eastern', EP: 'US/Central',
  OGG: 'US/Central', DCG: 'US/Central', TUG: 'US/Eastern',
  NPT: 'US/Eastern', HA: 'US/Eastern', KRM: 'US/Eastern',
  PAL: 'US/Central', RI: 'US/Eastern', CD: 'US/Eastern',
  DU: 'US/Eastern', EM: 'US/Eastern', VI: 'US/Eastern',
  WYD: 'US/Mountain', BH: 'US/Mountain', WHR: 'US/Mountain',
  GS: 'US/Eastern', OG: 'US/Eastern', 'IZI-MT': 'Europe/Malta',
  GRD: 'Africa/Johannesburg', GIL: 'US/Central', CCG: 'US/Central',
  NSH: 'US/Eastern', OWG: 'US/Central', HP5: 'US/Eastern',
  VLC: 'US/Central', PCIR: 'US/Central',
}

const ENTERPRISE_TO_HOURS_CODE: Record<string, string> = {
  WYD: 'WYD', WHR: 'WHR', '307': 'BH', NHG: 'NHG',
}

const DEFAULT_COLOR = '#64748b'
function getMarketColor(market: string): string {
  return MARKET_COLORS[market] ?? DEFAULT_COLOR
}

interface Props {
  facilities: MapFacility[]
}

export default function MapViewer({ facilities }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const dragging = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const last = useRef({ x: 0, y: 0 })
  const [selectedFacility, setSelectedFacility] = useState<MapFacility | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [activeMarkets, setActiveMarkets] = useState<Set<string>>(
    () => new Set(facilities.map(f => f.market).filter(Boolean))
  )
  const [filterEnterprise, setFilterEnterprise] = useState<string>('all')
  const [filterSearch, setFilterSearch] = useState<string>('')

  const markets = Array.from(new Set(facilities.map(f => f.market).filter(Boolean))).sort()
  const enterprises = Array.from(new Set(facilities.map(f => f.enterprise).filter(Boolean))).sort()
  const filtered = facilities.filter(f => activeMarkets.has(f.market))
  const totalMachines = filtered.reduce((sum, f) => sum + (f.machineCount ?? 0), 0)

  const listFiltered = filtered
    .filter(f => {
      if (filterEnterprise !== 'all' && f.enterprise !== filterEnterprise) return false
      if (filterSearch && !f.city.toLowerCase().includes(filterSearch.toLowerCase()) &&
          !f.siteName.toLowerCase().includes(filterSearch.toLowerCase())) return false
      return true
    })
    .sort((a, b) => a.city.localeCompare(b.city) || a.siteName.localeCompare(b.siteName))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setScale(s => Math.min(6, Math.max(0.5, s - e.deltaY * 0.001)))
    }
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos(p => ({ x: p.x + e.clientX - last.current.x, y: p.y + e.clientY - last.current.y }))
      last.current = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => { dragging.current = false; setIsDragging(false) }
    el.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      el.removeEventListener('wheel', onWheel)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    dragging.current = true
    setIsDragging(true)
    last.current = { x: e.clientX, y: e.clientY }
  }

  function resetView() {
    setPos({ x: 0, y: 0 })
    setScale(1)
    setSelectedFacility(null)
  }

  function flyTo(lat: number, lng: number) {
    const { x, y } = project(lat, lng)
    const cw = containerRef.current?.clientWidth ?? 900
    const ch = containerRef.current?.clientHeight ?? 560
    const newScale = 4
    const scaleX = cw / SVG_W
    setScale(newScale)
    setPos({ x: cw / 2 - x * scaleX * newScale, y: ch / 2 - y * scaleX * newScale })
  }

  function toggleMarket(market: string) {
    setActiveMarkets(prev => {
      const next = new Set(prev)
      if (next.has(market)) next.delete(market); else next.add(market)
      return next
    })
  }

  const dots = filtered.filter(f => {
    if (filterEnterprise !== 'all' && f.enterprise !== filterEnterprise) return false
    if (filterSearch && !f.city.toLowerCase().includes(filterSearch.toLowerCase()) &&
        !f.siteName.toLowerCase().includes(filterSearch.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 uppercase tracking-widest mr-1">Markets</span>
        <button onClick={() => setActiveMarkets(new Set(markets))}
          className="px-2.5 py-1 rounded-full text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-all">All</button>
        <button onClick={() => setActiveMarkets(new Set())}
          className="px-2.5 py-1 rounded-full text-xs border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-all">None</button>
        {markets.map(market => {
          const color = getMarketColor(market)
          const active = activeMarkets.has(market)
          return (
            <button key={market} onClick={() => toggleMarket(market)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${active ? 'text-slate-900 border-transparent' : 'border-slate-700 text-slate-500'}`}
              style={active ? { backgroundColor: color } : {}}>
              {market}
            </button>
          )
        })}
        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} facilities · {totalMachines.toLocaleString()} machines
        </span>
      </div>

      <div className="flex gap-4 items-start">
        <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117] flex-1">
          <div className="absolute top-3 right-3 z-10 flex gap-2">
            <button onClick={() => setScale(s => Math.min(6, s + 0.5))}
              className="w-8 h-8 bg-[#13152a] border border-slate-700 rounded text-slate-300 hover:text-white text-lg font-bold flex items-center justify-center">+</button>
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.5))}
              className="w-8 h-8 bg-[#13152a] border border-slate-700 rounded text-slate-300 hover:text-white text-lg font-bold flex items-center justify-center">−</button>
            <button onClick={resetView}
              className="px-2 h-8 bg-[#13152a] border border-slate-700 rounded text-slate-300 hover:text-white text-xs">Reset</button>
          </div>
          <div className="absolute bottom-3 left-3 z-10 text-xs text-slate-600 pointer-events-none">
            Scroll to zoom · Click a dot to select
          </div>
          <div
            ref={containerRef}
            style={{ height: '560px', cursor: 'default', userSelect: 'none', overflow: 'hidden' }}
            onMouseDown={onMouseDown}
          >
            <div style={{
              transformOrigin: 'top left',
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.3s ease',
              width: '100%',
              height: '560px',
              position: 'absolute',
              top: 0,
              left: 0,
            }}>
              <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: '100%' }}>
                <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#1e3a5f" />
                {MAP_PATHS.map(({ name, d }) => (
                  <path key={name} d={d} fill="#2d5a8e" stroke="#4a8bc4" strokeWidth="0.5" />
                ))}
                <circle cx={787} cy={133} r={4} fill="#2d5a8e" stroke="#4a8bc4" strokeWidth="0.5" />
                {dots.map((facility) => {
                  const offset = SITE_OFFSETS[facility.siteCode]
                  const lat = facility.lat + (offset?.dlat ?? 0)
                  const lng = facility.lng + (offset?.dlng ?? 0)
                  const { x, y } = project(lat, lng)
                  const color = getMarketColor(facility.market)
                  const key = facility.siteCode
                  const isSelected = selectedFacility?.siteCode === facility.siteCode
                  const isHovered = hoveredKey === key
                  const r = facility.machineCount
                    ? Math.max(3, Math.min(10, Math.sqrt(facility.machineCount) * 0.4))
                    : 4
                  return (
                    <g key={key}
                      style={{ cursor: 'pointer', opacity: selectedFacility && !isSelected ? 0.2 : 1, transition: 'opacity 0.2s ease' }}
                      onClick={(e) => { e.stopPropagation(); if (!isDragging) { setSelectedFacility(facility); flyTo(lat, lng) } }}
                      onMouseEnter={() => setHoveredKey(key)}
                      onMouseLeave={() => setHoveredKey(null)}
                    >
                      {isSelected && <circle cx={x} cy={y} r={r + 6} fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />}
                      <circle cx={x} cy={y} r={isHovered || isSelected ? r + 2 : r}
                        fill={color} stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                      {isHovered && (
                        <text x={x} y={y - r - 4} textAnchor="middle" fill="white"
                          fontSize="8" fontWeight="bold"
                          style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))', pointerEvents: 'none' }}>
                          {facility.siteName.length > 20 ? facility.city : facility.siteName}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>
        </div>

        <div className="w-72 shrink-0">
          {selectedFacility ? (
            <div className="bg-[#13152a] border border-slate-700 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getMarketColor(selectedFacility.market) }} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex-1 ml-2">
                  {selectedFacility.market}
                </span>
                <button onClick={() => setSelectedFacility(null)}
                  className="text-slate-600 hover:text-slate-300 text-lg leading-none">✕</button>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{selectedFacility.city}</h2>
              <p className="text-xs text-slate-400 mb-4">{selectedFacility.siteName}</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Enterprise</span>
                  <span className="text-sm text-slate-200 font-medium">{selectedFacility.enterprise}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Site Code</span>
                  <span className="text-sm font-mono text-orange-400">{selectedFacility.siteCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Country</span>
                  <span className="text-sm text-slate-200">{selectedFacility.country}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Market</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-slate-900"
                    style={{ backgroundColor: getMarketColor(selectedFacility.market) }}>
                    {selectedFacility.market}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Machines</span>
                  <span className="text-sm font-bold text-white">
                    {selectedFacility.machineCount?.toLocaleString() ?? '—'}
                  </span>
                </div>
                {(() => {
                  const hoursCode = SITE_HOURS[selectedFacility.siteCode]
                    ? selectedFacility.siteCode
                    : ENTERPRISE_TO_HOURS_CODE[selectedFacility.enterprise]
                  const hours = SITE_HOURS[hoursCode]
                  const timezone = SITE_TIMEZONES[hoursCode]
                  return hours ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 uppercase tracking-widest">Timezone</span>
                        <span className="text-xs text-slate-300">{timezone ?? '—'}</span>
                      </div>
                    </>
                  ) : null
                })()}
              </div>
              <button onClick={resetView}
                className="mt-4 w-full text-xs px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-all">
                ← Back to full map
              </button>
            </div>
          ) : (
            <div className="bg-[#13152a] border border-slate-800 rounded-lg p-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Facilities</p>
              <input
                type="text"
                placeholder="Search city or site name..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="w-full bg-[#0a0b14] border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 mb-3"
              />
              <select
                value={filterEnterprise}
                onChange={e => setFilterEnterprise(e.target.value)}
                className="w-full bg-[#0a0b14] border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 mb-3"
              >
                <option value="all">All Enterprises</option>
                {enterprises.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              <div className="text-xs text-slate-400 mb-2">{listFiltered.length} results</div>
              <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
                {listFiltered.map((f) => (
                  <button key={f.siteCode} onClick={() => { setSelectedFacility(f); flyTo(f.lat + (SITE_OFFSETS[f.siteCode]?.dlat ?? 0), f.lng + (SITE_OFFSETS[f.siteCode]?.dlng ?? 0)) }}
                    className="flex items-center gap-2 px-2 py-2 rounded hover:bg-slate-800 transition-colors text-left w-full">
                    <div className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: getMarketColor(f.market) }} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs text-slate-200 truncate">{f.siteName}</span>
                      <span className="text-xs text-slate-500">{f.city} · {f.market}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 bg-[#13152a] border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">Legend</div>
            <div className="flex flex-col gap-2">
              {markets.map(market => {
                const count = facilities.filter(f => f.market === market).length
                const machines = facilities.filter(f => f.market === market)
                  .reduce((sum, f) => sum + (f.machineCount ?? 0), 0)
                return (
                  <div key={market} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getMarketColor(market) }} />
                    <span className="text-xs text-slate-300 flex-1">{market}</span>
                    <span className="text-xs text-slate-400">{count} sites</span>
                    <span className="text-xs text-white font-medium">{machines.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}