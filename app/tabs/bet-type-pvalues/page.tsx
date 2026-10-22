import Link from 'next/link'
import { fetchBetTypePvalues } from '@/lib/fetchBetTypePvalues'
import BetTypePvaluesClient from './BetTypePvaluesClient'

export const dynamic = 'force-dynamic'

export default async function BetTypePvaluesPage() {
  const data = await fetchBetTypePvalues()

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-7xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors">
          ← Back to Dashboard
        </Link>

        {data ? (
          <BetTypePvaluesClient data={data} />
        ) : (
          <div className="rounded-lg border border-slate-800 bg-[#13152a] p-6 text-slate-400">
            No bet type p-value data yet. Check that the writer Lambda has run and the API route is deployed.
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Roulette Bet Type P-Values
        </footer>
      </div>
    </div>
  )
}