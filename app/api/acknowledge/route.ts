import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.AWS_API_GATEWAY_BASE_URL
const API_KEY = process.env.AWS_API_KEY!

async function callLambda(method: string, body: object) {
  const url = `${BASE_URL}/low-pools/acknowledge`
  console.log(`[acknowledge] ${method} → ${url}`)
  console.log(`[acknowledge] body:`, JSON.stringify(body))
  console.log(`[acknowledge] API_KEY present:`, !!API_KEY)
  console.log(`[acknowledge] BASE_URL:`, BASE_URL)

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const text = await res.text()
  console.log(`[acknowledge] response status:`, res.status)
  console.log(`[acknowledge] response body:`, text)

  if (!res.ok) {
    throw new Error(`Lambda error: ${res.status} — ${text}`)
  }

  return JSON.parse(text)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = await callLambda('POST', body)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[acknowledge] POST error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const data = await callLambda('DELETE', body)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[acknowledge] DELETE error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}