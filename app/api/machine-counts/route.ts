import { NextResponse } from 'next/server'
import { fetchMachineCounts } from '@/lib/fetchMachineCounts'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const window = searchParams.get('window') ?? '6'

    const data = await fetchMachineCounts()

    if (window !== 'all') {
      const n = parseInt(window, 10)
      const sliceStart = data.months.length - n

      return NextResponse.json({
        months: data.months.slice(sliceStart),
        rows: data.rows.map(row => ({
          ...row,
          counts: row.counts.slice(sliceStart),
        })),
      }, {
        headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
      })
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
    })
  } catch (err) {
    console.error('Tableau fetch error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}