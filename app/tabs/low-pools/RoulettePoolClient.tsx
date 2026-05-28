'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { RoulettePoolData } from '@/lib/fetchRoulettePool'

const SITE_COLORS = [
  '#38bdf8', // sky
  '#f97316', // orange
  '#a78bfa', // violet
  '#34d399', // emerald
  '#fb7185', // rose
  '#fbbf24', // amber
  '#60a5fa', // blue
  '#4ade80', // green
  '#e879f9', // fuchsia
  '#94a3b8', // slate
]

interface ChartPoint {
  date: string
  [site: string]: string | number
}

export default function RoulettePoolClient({ data }: { data: RoulettePoolData }) {
  const [hiddenSites, setHiddenSites] = useState<Set<string>>(new Set())

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
                hidden
                  ? 'border-slate-700 text-slate-600 bg-transparent'
                  : 'border-transparent text-slate-900'
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

      {/* Summary table */}
      <div className="bg-[#13152a] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Latest Values</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Site</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Seed %</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.sites.map((site, i) => {
              const sitePoints = data.points.filter(p => p.site === site)
              const latest = sitePoints[sitePoints.length - 1]
              return (
                <tr key={site} className="border-t border-slate-800 hover:bg-[#1a1d35] transition-colors">
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: SITE_COLORS[i % SITE_COLORS.length] }}
                    />
                    <span className="text-slate-200 font-medium">{site}</span>
                  </td>
                  <td className="text-right px-4 py-2.5 tabular-nums">
                    {latest ? (
                      <span className={`font-semibold ${latest.seedPct < 96 ? 'text-rose-400' : latest.seedPct < 98 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {latest.seedPct.toFixed(2)}%
                      </span>
                    ) : '—'}
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