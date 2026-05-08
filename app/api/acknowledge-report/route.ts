import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.AWS_API_GATEWAY_BASE_URL
const API_KEY = process.env.AWS_API_KEY!

async function callLambda(method: string, body: object) {
  const res = await fetch(`${BASE_URL}/report-comps/acknowledge`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`Lambda error: ${res.status} — ${text}`)
  return JSON.parse(text)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = await callLambda('POST', body)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const data = await callLambda('DELETE', body)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}