import React from 'react'
import Link from 'next/link'
import { fetchMachineCounts, MachineRow } from '@/lib/fetchMachineCounts'

interface MarketGroup {
  market: string
  facilities: MachineRow[]
}

export default async function MachineCountsPage() {
  const { rows } = await fetchMachineCounts()

  const marketMap = new Map<string, MachineRow[]>()
  for (const row of rows) {
    if (!marketMap.has(row.market)) marketMap.set(row.market, [])
    marketMap.get(row.market)!.push(row)
  }

  const groups: MarketGroup[] = Array.from(marketMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([market, facilities]) => ({ market, facilities }))

  const totalFacilities = rows.length
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
          <div className="flex items-center gap-3">
            <span className="text-3xl">🖥️</span>
            <h1 className="text-2xl font-bold text-white">Machine Counts</h1>
          </div>
          <p className="text-slate-400 text-sm mt-3">Machine counts by market.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
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

        {/* Map + Table side by side */}
        <div className="flex gap-6 items-start">

          {/* Map — now wider */}
          <div className="w-[600px] shrink-0 bg-[#13152a] border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Exacta Map</span>
            </div>
            <img
              src="/data/exacta-map.png"
              alt="Exacta facilities map"
              className="w-full h-auto"
            />
          </div>

          {/* Market Table — latest month only */}
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
                        {group.market}
                      </td>
                      <td className="text-right px-4 py-2.5 text-slate-300 tabular-nums">
                        {total > 0 ? total.toLocaleString() : '—'}
                      </td>
                    </tr>
                  )
                })}

                {/* Grand Total */}
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