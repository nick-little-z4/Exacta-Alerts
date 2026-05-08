import TabCard from '@/components/TabCard'
import { tabs } from '@/lib/tabs'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#131629] py-10 px-6">
      <div className="max-w-4xl mx-auto">

        <header className="border-b border-slate-700 pb-5 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-orange-400 to-pink-500" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Exacta Alerts</h1>
          </div>
        </header>

        <p className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">
          Dashboard Tabs
        </p>
        <div className="grid grid-cols-2 gap-4">
          {tabs.map((tab) => <TabCard key={tab.slug} tab={tab} />)}
        </div>

      </div>
    </div>
  )
}