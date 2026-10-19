import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.EXACTA_API_BASE_URL
const API_KEY = process.env.EXACTA_API_KEY!

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
  if (!res.ok) throw new Error(`Lambda error: ${res.status} - ${text}`)
  return JSON.parse(text)
}

async function handle(req: NextRequest, method: string) {
  try {
    const body = await req.json()
    const data = await callLambda(method, body)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) { return handle(req, 'POST') }
export async function DELETE(req: NextRequest) { return handle(req, 'DELETE') }
export async function PATCH(req: NextRequest) { return handle(req, 'PATCH') }