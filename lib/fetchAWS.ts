export async function fetchAWS(path: string) {
  const res = await fetch(`${process.env.AWS_API_GATEWAY_BASE_URL}${path}`, {
    headers: { 'x-api-key': process.env.AWS_API_KEY! },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`AWS API error on ${path}: ${res.status}`)
  return res.json()
}
