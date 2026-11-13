import { NextRequest, NextResponse } from 'next/server'
import { notifySlackSoon } from '@/lib/notifySlack'

// Proxies acknowledge actions to the n_prizes_acknowledge Lambda so the API key stays on the server
async function forward(req: NextRequest, method: 'POST' | 'DELETE' | 'PATCH') {
  try {
    const body = await req.text()
    const res = await fetch(`${process.env.EXACTA_API_BASE_URL}/n-prizes/acknowledge`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXACTA_API_KEY ?? '',
      },
      body,
      cache: 'no-store',
    })
    const text = await res.text()
    // Acknowledging or un-acknowledging changes the alerts, so tell Slack now
    if (res.ok && method !== 'PATCH') notifySlackSoon()
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) { return forward(req, 'POST') }
export async function DELETE(req: NextRequest) { return forward(req, 'DELETE') }
export async function PATCH(req: NextRequest) { return forward(req, 'PATCH') }