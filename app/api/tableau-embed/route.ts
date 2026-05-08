import { NextResponse } from 'next/server'

const API_VERSION = '3.23'

async function getTokenAndSite() {
  const res = await fetch(
    `${process.env.TABLEAU_HOST}/api/${API_VERSION}/auth/signin`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        credentials: {
          personalAccessTokenName: process.env.TABLEAU_PAT_NAME,
          personalAccessTokenSecret: process.env.TABLEAU_PAT_SECRET,
          site: { contentUrl: process.env.TABLEAU_SITE_CONTENT_URL },
        },
      }),
    }
  )
  const data = await res.json()
  if (!data.credentials) throw new Error(`Signin failed: ${JSON.stringify(data)}`)
  return { token: data.credentials.token, siteId: data.credentials.site.id }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const workbookId = searchParams.get('viewId')
  if (!workbookId) return NextResponse.json({ error: 'Missing viewId' }, { status: 400 })

  try {
    const { token, siteId } = await getTokenAndSite()

    // Fetch the views belonging to this workbook
    const viewsRes = await fetch(
      `${process.env.TABLEAU_HOST}/api/${API_VERSION}/sites/${siteId}/workbooks/${workbookId}/views`,
      { headers: { 'X-Tableau-Auth': token, 'Accept': 'application/json' } }
    )
    const viewsData = await viewsRes.json()
    console.log('Workbook views:', JSON.stringify(viewsData, null, 2))

    const views = viewsData.views?.view
    if (!views || views.length === 0) throw new Error(`No views found: ${JSON.stringify(viewsData)}`)

    // Use the first view
    const view = views[0]
    const contentUrl = view.contentUrl
    const [workbook, , sheet] = contentUrl.split('/')
    const embedUrl = `${process.env.TABLEAU_HOST}/views/${workbook}/${sheet}`

    return NextResponse.json({ token, embedUrl, allViews: views.map((v: { name: string; contentUrl: string }) => ({ name: v.name, contentUrl: v.contentUrl })) })
  } catch (err) {
    console.error('Tableau embed error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}