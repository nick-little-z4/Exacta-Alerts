import { NextRequest, NextResponse } from 'next/server'
import { getBadgeSummary } from '@/lib/badges'

export const dynamic = 'force-dynamic'

/**
 * GET /api/badges
 * Current alert counts and items, same logic as the home page.
 * Requires header x-api-key matching BADGES_API_KEY (used by the Slack notifier).
 */
export async function GET(req: NextRequest) {
  const expected = process.env.BADGES_API_KEY
  if (!expected) {
    return NextResponse.json({ error: 'BADGES_API_KEY is not configured' }, { status: 500 })
  }
  if (req.headers.get('x-api-key') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await getBadgeSummary()
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}