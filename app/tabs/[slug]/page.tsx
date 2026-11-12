import { tabs } from '@/lib/tabs'
import TabPageLayout from '@/components/TabPageLayout'
import { notFound } from 'next/navigation'

// Tabs with their own folder under app/tabs/. Add new dedicated pages here,
// or the generic page below will also build that route and can 404 on Amplify.
const DEDICATED_PAGES = [
  'machine-counts',
  'exacta-map',
  'low-pools',
  'manual-handicapping-wins',
  'daily-report-mismatch',
  'n-prizes',
  'zero-takeout-monitor',
  'bet-type-pvalues',
]

export function generateStaticParams() {
  return tabs
    .filter(tab => !DEDICATED_PAGES.includes(tab.slug))
    .map((tab) => ({ slug: tab.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const tab = tabs.find((t) => t.slug === params.slug)
  return { title: tab ? `${tab.title} | Exacta Alerts` : 'Not Found' }
}

export default function TabPage({ params }: { params: { slug: string } }) {
  if (DEDICATED_PAGES.includes(params.slug)) notFound()
  const tab = tabs.find((t) => t.slug === params.slug)
  if (!tab) notFound()
  return <TabPageLayout tab={tab} />
}