import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/manual-handicapping-wins/acknowledge`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXACTA_API_KEY ?? '',
      },
      body: JSON.stringify(body),
    }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(
    `${process.env.EXACTA_API_BASE_URL}/manual-handicapping-wins/acknowledge`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXACTA_API_KEY ?? '',
      },
      body: JSON.stringify(body),
    }
  )
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}