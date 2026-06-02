'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { RoulettePoolData } from '@/lib/fetchRoulettePool'

const SITE_COLORS = [
  '#38bdf8', '#f97316', '#a78bfa', '#34d399', '#fb7185',
  '#fbbf24', '#60a5fa', '#4ade80', '#e879f9', '#94a3b8',
]

interface ChartPoint {
  date: string
  [site: string]: string | number
}

function getTrend(points: { seedPct: number }[]): { arrow: string; color: string; label: string } {
  if (points.length < 3) return { arrow: '→', color: 'text-slate-500', label: 'Stable' }
  const last3 = points.slice(-3)
  const first = last3[0].seedPct
  const last = last3[last3.length - 1].seedPct
  const delta = last - first
  if (delta > 0.3) return { arrow: '↑', color: 'text-emerald-400', label: `+${delta.toFixed(2)}%` }
  if (delta < -0.3) return { arrow: '↓', color: 'text-rose-400', label: `${delta.toFixed(2)}%` }
  return { arrow: '→', color: 'text-slate-400', label: 'Stable' }
}

export default function RoulettePoolClient({ data }: { data: RoulettePoolData }) {
  const [hiddenSites, setHiddenSites] = useState<Set<string>>(new Set())
  const [threshold, setThreshold] = useState(95)
  const [showThreshold, setShowThreshold] = useState(true)

  const toggleSite = (site: string) => {
    setHiddenSites(prev => {
      const next = new Set(prev)
      if (next.has(site)) next.delete(site)
      else next.add(site)
      return next
    })
  }

  const chartData: ChartPoint[] = data.dates.map(date => {
    const point: ChartPoint = { date }
    for (const site of data.sites) {
      const match = data.points.find(p => p.date === date && p.site === site)
      if (match) point[site] = parseFloat(match.seedPct.toFixed(2))
    }
    return point
  })

  const formatDate = (d: string) => {
    const parsed = new Date(d)
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return d
  }

  // Build summary rows sorted by latest seed % ascending (worst first)
  const summaryRows = data.sites.map((site, i) => {
    const sitePoints = data.points.filter(p => p.site === site)
    const latest = sitePoints[sitePoints.length - 1]
    const trend = getTrend(sitePoints)
    return { site, i, latest, trend }
  }).sort((a, b) => (a.latest?.seedPct ?? 999) - (b.latest?.seedPct ?? 999))

  // Count sites below threshold
  const belowThreshold = summaryRows.filter(r => r.latest && r.latest.seedPct < threshold).length

  if (data.points.length === 0) {
    return (
      <div className="bg-[#13152a] border border-slate-800 rounded-lg p-10 text-center text-slate-500 text-sm">
        No roulette pool data available.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Site toggle pills */}
      <div className="flex flex-wrap gap-2">
        {data.sites.map((site, i) => {
          const color = SITE_COLORS[i % SITE_COLORS.length]
          const hidden = hiddenSites.has(site)
          return (
            <button
              key={site}
              onClick={() => toggleSite(site)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                hidden ? 'border-slate-700 text-slate-600 bg-transparent' : 'border-transparent text-slate-900'
              }`}
              style={hidden ? {} : { backgroundColor: color }}
            >
              {site}
            </button>
          )
        })}
        {hiddenSites.size > 0 && (
          <button
            onClick={() => setHiddenSites(new Set())}
            className="px-3 py-1 rounded-full text-xs text-slate-500 border border-slate-700 hover:border-slate-400 hover:text-slate-300 transition-all"
          >
            Show all
          </button>
        )}
      </div>

      {/* Threshold controls */}
      <div className="flex items-center gap-4 bg-[#13152a] border border-slate-800 rounded-lg px-4 py-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showThreshold}
            onChange={e => setShowThreshold(e.target.checked)}
            className="accent-rose-500"
          />
          <span className="text-xs text-slate-400 uppercase tracking-widest">Threshold Line</span>
        </label>
        <input
          type="range"
          min={90}
          max={100}
          step={0.5}
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          disabled={!showThreshold}
          className="w-32 accent-rose-500 disabled:opacity-30"
        />
        <span className="text-sm font-semibold text-rose-400 w-14">{threshold.toFixed(1)}%</span>
        {belowThreshold > 0 && (
          <span className="text-xs px-2 py-1 rounded bg-rose-900/40 border border-rose-700/50 text-rose-300">
            {belowThreshold} site{belowThreshold !== 1 ? 's' : ''} below threshold
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="bg-[#13152a] border border-slate-800 rounded-lg p-6">
        <div className="text-xs text-slate-400 uppercase tracking-widest mb-6">Seed % by Site Over Time</div>
        <ResponsiveContainer width="100%" height={420}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2035" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#13152a',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              labelFormatter={(label: unknown) => formatDate(String(label))}
              formatter={(value: unknown) => [
                value != null ? `${Number(value).toFixed(2)}%` : '—'
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
              formatter={(value: string) => <span style={{ color: '#94a3b8' }}>{value}</span>}
            />
            {showThreshold && (
              <ReferenceLine
                y={threshold}
                stroke="#fb7185"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{ value: `${threshold}%`, fill: '#fb7185', fontSize: 11, position: 'insideTopRight' }}
              />
            )}
            {data.sites.map((site, i) => (
              !hiddenSites.has(site) && (
                <Line
                  key={site}
                  type="monotone"
                  dataKey={site}
                  stroke={SITE_COLORS[i % SITE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table — sorted worst first */}
      <div className="bg-[#13152a] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Latest Values</span>
          <span className="text-xs text-slate-600">sorted by seed % · worst first</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Site</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Seed %</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center justify-center gap-1">
                    Trend
                    <span className="relative group">
                    <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full border border-slate-600 text-slate-500 hover:border-sky-500 hover:text-sky-400 cursor-help transition-all text-[9px] font-bold">
                        i
                    </span>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-[#0a0b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-left normal-case tracking-normal font-normal">
                        Shows whether a site's seed % is improving or declining over the past 3 days. A positive trend means the seed % is higher today than it was 3 days ago, even if it's still below the threshold.<br/><br/>
                        <span className="text-emerald-400">↑</span> Higher than 3 days ago &nbsp;
                        <span className="text-rose-400">↓</span> Lower than 3 days ago &nbsp;
                        <span className="text-slate-400">→</span> Roughly the same
                        </div>
                    </span>
                </span>
                </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {summaryRows.map(({ site, i, latest, trend }) => {
              const belowLine = latest && latest.seedPct < threshold
              return (
                <tr key={site} className={`border-t border-slate-800 hover:bg-[#1a1d35] transition-colors ${belowLine ? 'bg-rose-950/20' : ''}`}>
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: SITE_COLORS[i % SITE_COLORS.length] }}
                    />
                    <span className="text-slate-200 font-medium">{site}</span>
                    {belowLine && showThreshold && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-400 border border-rose-800/50">
                        below {threshold}%
                      </span>
                    )}
                  </td>
                  <td className="text-right px-4 py-2.5 tabular-nums">
                    {latest ? (
                      <span className={`font-semibold ${latest.seedPct < 95 ? 'text-rose-400' : latest.seedPct < 98 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {latest.seedPct.toFixed(2)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-center px-4 py-2.5">
                    <span className={`text-sm font-bold ${trend.color}`} title={trend.label}>
                      {trend.arrow}
                    </span>
                    <span className={`text-xs ml-1 ${trend.color}`}>{trend.label}</span>
                  </td>
                  <td className="text-right px-4 py-2.5 text-xs text-slate-500">
                    {latest ? formatDate(latest.date) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}