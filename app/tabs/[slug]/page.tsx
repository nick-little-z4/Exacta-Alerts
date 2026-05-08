import { tabs } from '@/lib/tabs'
import TabPageLayout from '@/components/TabPageLayout'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return tabs.map((tab) => ({ slug: tab.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const tab = tabs.find((t) => t.slug === params.slug)
  return { title: tab ? `${tab.title} — Exacta Alerts` : 'Not Found' }
}

export default function TabPage({ params }: { params: { slug: string } }) {
  const tab = tabs.find((t) => t.slug === params.slug)
  if (!tab) notFound()
  return <TabPageLayout tab={tab} />
}