import { NextRequest, NextResponse } from 'next/server'

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