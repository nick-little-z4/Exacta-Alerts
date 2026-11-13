import { NextRequest, NextResponse } from 'next/server'
import { notifySlackSoon } from '@/lib/notifySlack'

async function forward(req: NextRequest, method: string) {
  const body = await req.json()
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/low-pools-ecs/acknowledge`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXACTA_API_KEY ?? '',
      },
      body: JSON.stringify(body),
    }
  )
  const data = await res.json()
  // Acknowledging or un-acknowledging changes the alerts, so tell Slack now (notes don't)
  if (res.ok && method !== 'PATCH') notifySlackSoon()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  return forward(req, 'POST')
}

export async function DELETE(req: NextRequest) {
  return forward(req, 'DELETE')
}

export async function PATCH(req: NextRequest) {
  return forward(req, 'PATCH')
}