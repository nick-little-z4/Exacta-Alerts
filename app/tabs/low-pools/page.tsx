import Link from 'next/link'
import { fetchLowPools } from '@/lib/fetchLowPools'
import LowPoolsClient from './LowPoolsClient'

export default async function LowPoolsPage() {
  const data = await fetchLowPools()

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-6xl mx-auto">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <h1 className="text-2xl font-bold text-white">Low Pools</h1>
          </div>
          <p className="text-slate-400 text-sm mt-3">
            Games with critically low pool balances.
          </p>
        </div>

        <LowPoolsClient data={data} />

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Low Pools
        </footer>

      </div>
    </div>
  )
}