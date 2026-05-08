import { Suspense } from 'react'
import Link from 'next/link'
import { fetchReportComps } from '@/lib/fetchReportComps'
import DateRangeFilter from './DateRangeFilter'
import ReportCompsClient from './ReportCompsClient'

function toDate(raw: string): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d
  return null
}

export default async function DailyReportMismatchPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const { days: daysParam = '7' } = await searchParams
  const days = parseInt(daysParam) || 7

  let rows: Awaited<ReturnType<typeof fetchReportComps>>['rows'] = []
  let acknowledged: Awaited<ReturnType<typeof fetchReportComps>>['acknowledged'] = []
  let error: string | null = null

  try {
    const data = await fetchReportComps()
    rows = data.rows
    acknowledged = data.acknowledged
  } catch (err) {
    error = String(err)
  }

  // Filter to selected lookback window
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - days)

  const filteredRows = rows.filter(r => {
    const d = toDate(r.date)
    if (!d) return true
    return d.getTime() >= cutoff.getTime()
  })

  // Sort by date descending
  const sortedRows = [...filteredRows].sort((a, b) => {
    const aDate = toDate(a.date)
    const bDate = toDate(b.date)
    if (!aDate || !bDate) return 0
    return bDate.getTime() - aDate.getTime()
  })

  const withVariance = filteredRows.filter(r => r.handleVariance !== null && r.handleVariance !== 0).length
  const positiveVariance = filteredRows.filter(r => (r.handleVariance ?? 0) > 0).length
  const acknowledgedCount = acknowledged.length

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#0a0b14] text-slate-100 px-6 py-10">
      <div className="max-w-6xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-colors">
          ← Back to Dashboard
        </Link>

        <div className="border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <h1 className="text-2xl font-bold text-white">Mismatch Reports</h1>
            </div>
            <Suspense fallback={null}>
              <DateRangeFilter currentDays={daysParam} />
            </Suspense>
          </div>
          <p className="text-slate-400 text-sm mt-3">
            Facility daily reports where handle variance is inconsistent with the source system.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2">
              <span className="text-slate-500 text-xs uppercase tracking-widest">Today</span>
              <span className="text-slate-200 text-xs font-semibold">{today}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#13152a] border border-slate-800 rounded-md px-3 py-2">
              <span className="text-slate-500 text-xs uppercase tracking-widest">Lookback</span>
              <span className="text-slate-200 text-xs font-semibold">Last {days} day{days !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-rose-950 border border-rose-800 rounded-lg p-6 text-rose-300">
            Failed to load data: {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-[#13152a] border border-amber-900/50 rounded-lg p-5">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">With Variance</div>
                <div className="text-3xl font-bold text-amber-400">{withVariance}</div>
                <div className="text-xs text-slate-500 mt-1">Mismatches in period</div>
              </div>
              <div className="bg-[#13152a] border border-rose-900/50 rounded-lg p-5">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Positive Variance</div>
                <div className="text-3xl font-bold text-rose-400">{positiveVariance}</div>
                <div className="text-xs text-slate-500 mt-1">Reported over master DB</div>
              </div>
              <div className="bg-[#13152a] border border-emerald-900/50 rounded-lg p-5">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Acknowledged</div>
                <div className="text-3xl font-bold text-emerald-400">{acknowledgedCount}</div>
                <div className="text-xs text-slate-500 mt-1">Reviewed by staff</div>
              </div>
            </div>

            <ReportCompsClient
              rows={sortedRows}
              acknowledged={acknowledged}
            />
          </>
        )}

        <footer className="mt-12 text-center text-xs text-slate-600">
          Exacta Alerts · Mismatch Reports
        </footer>
      </div>
    </div>
  )
}