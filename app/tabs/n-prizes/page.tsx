import Link from 'next/link'
import { fetchNPrizes } from '@/lib/fetchNPrizes'
import NPrizesClient from './NPrizesClient'

export default async function NPrizesPage() {
  let comparison: Awaited<ReturnType<typeof fetchNPrizes>> | null = null
  let error: string | null = null

  try {
    comparison = await fetchNPrizes()
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏅</span>
              <h1 className="text-2xl font-bold text-white">N Prizes</h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-3">
            N prizes tells us how many prizes it took to get the $5000+ payout. More than 5 prizes indicates a possible game malfunction.
          </p>
        </div>

        {error ? (
          <div className="bg-rose-950 border border-rose-800 rounded-lg p-6 text-rose-300">
            Failed to load data: {error}
          </div>
        ) : (
          <NPrizesClient comparison={comparison!} />
        )}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · N Prizes
        </footer>
      </div>
    </div>
  )
}