import Link from 'next/link'
import { fetchNPrizes, NPrizesRow } from '@/lib/fetchNPrizes'

function formatCurrency(val: number): string {
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

function formatDenom(val: number): string {
  if (val >= 1) return `$${val.toFixed(0)}`
  return `${(val * 100).toFixed(0)}¢`
}

export default async function NPrizesPage() {
  let data: NPrizesRow[] = []
  let timestamp = ''
  let error: string | null = null

  try {
    const result = await fetchNPrizes()
    data = result.data
    timestamp = result.timestamp
  } catch (err) {
    error = String(err)
  }

  const multiPrizeCount = data.filter(r => r.num_prizes >= 2).length

  // Sort by first_exceeding_row descending to match original
  const sorted = [...data].sort((a, b) => b.first_exceeding_row - a.first_exceeding_row)

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-7xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors">
          ← Back to Dashboard
        </Link>

        <div className="border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏅</span>
            <h1 className="text-2xl font-bold text-white">N Prizes</h1>
          </div>
        </div>
          <p className="text-slate-400 text-sm mt-3">
            Games that paid out over $5000 last week.
          </p>
          {timestamp && (
            <div className="mt-4 flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2 w-fit">
              <span className="text-slate-500 text-xs uppercase tracking-widest">Updated</span>
              <span className="text-slate-200 text-xs font-semibold">{timestamp} UTC</span>
            </div>
          )}
        </div>

        {error ? (
          <div className="bg-rose-950 border border-rose-800 rounded-lg p-6 text-rose-300">
            Failed to load data: {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-[#13152a] border border-amber-900/50 rounded-lg p-5">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Entries</div>
                <div className="text-3xl font-bold text-amber-400">{data.length}</div>
                <div className="text-xs text-slate-500 mt-1">Games flagged</div>
              </div>
              <div className="bg-[#13152a] border border-rose-900/50 rounded-lg p-5">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Multi-Prize</div>
                <div className="text-3xl font-bold text-rose-400">{multiPrizeCount}</div>
                <div className="text-xs text-slate-500 mt-1">2+ prizes to exceed net</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13152a] text-slate-400 text-xs uppercase tracking-widest">
                    <th className="px-4 py-3 text-left">Math Name</th>
                    <th className="px-4 py-3 text-right">Denom</th>
                    <th className="px-4 py-3 text-left">Site</th>
                    <th className="px-4 py-3 text-right">Net Prizes</th>
                    <th className="px-4 py-3 text-right"># Prizes</th>
                    <th className="px-4 py-3 text-left">Top Prizes</th>
                    <th className="px-4 py-3 text-right">First Exceeding Row</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <tr key={i} className={`border-t border-slate-800 hover:bg-[#13152a] transition-colors ${row.num_prizes >= 2 ? 'bg-rose-950/10' : ''}`}>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{row.mathname}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{formatDenom(row.denom)}</td>
                      <td className="px-4 py-3 font-semibold text-orange-400">{row.sitename}</td>
                      <td className="px-4 py-3 text-right text-rose-400 font-semibold">{formatCurrency(row.netprizes)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.num_prizes >= 2 ? 'bg-rose-900/50 text-rose-300' : 'bg-slate-800 text-slate-400'}`}>
                          {row.num_prizes}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{row.top_prizes}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{row.first_exceeding_row}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · N Prizes
        </footer>
      </div>
    </div>
  )
}