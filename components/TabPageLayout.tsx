import Link from 'next/link'
import { Tab } from '@/lib/tabs'

function SectionTitle({ title, className = 'text-slate-500' }: { title: string; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${className}`}>{title}</p>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <SectionTitle title={title} />
      {children}
    </div>
  )
}

export default function TabPageLayout({ tab }: { tab: Tab }) {
  return (
    <div className="min-h-screen bg-[#0a0b14] py-10 px-6">
      <div className="max-w-3xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-1 text-sm text-orange-400 font-semibold hover:text-orange-300 mb-8">
          ← Back to Dashboard
        </Link>

        {/* Header card */}
        <div className="relative bg-[#13152a] border border-slate-800 rounded-lg p-8 mb-4 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-pink-500" />
          <div className="text-4xl mb-3">{tab.icon}</div>
          <h1 className="text-2xl font-bold text-white">{tab.title}</h1>
          {tab.lastUpdated && (
            <p className="text-xs text-slate-500 mt-1">Updated {tab.lastUpdated}</p>
          )}
        </div>

        {/* Goal + Data Sources */}
        <div className="bg-[#13152a] border border-slate-800 rounded-lg p-6 mb-4">
          <Section title="Goal">
            <p className="text-sm text-slate-300 leading-relaxed">{tab.goal}</p>
          </Section>
          <div className="grid grid-cols-2 gap-3">
            {tab.dataSources.map((ds) => (
              <div key={ds.label} className="bg-[#0a0b14] border border-slate-800 rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">{ds.label}</p>
                <p className="text-sm font-medium text-slate-200">{ds.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        {tab.requirements.length > 0 ? (
          <div className="bg-[#13152a] border border-orange-500/20 rounded-lg p-6 mb-4">
            <SectionTitle title="Open Requirements" className="text-orange-400" />
            <ul className="space-y-3 mt-2">
              {tab.requirements.map((req) => (
                <li key={req.title} className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-white">{req.title}:</strong> {req.detail}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-[#13152a] border border-slate-800 rounded-lg p-6 mb-4">
            <SectionTitle title="Open Requirements" />
            <p className="text-sm text-slate-500 italic">No open requirements. This tab is ready for development.</p>
          </div>
        )}

        {/* Display Details */}
        <div className="bg-[#13152a] border border-slate-800 rounded-lg p-6 mb-4">
          <Section title="Display Details">
            <p className="text-sm text-slate-300 leading-relaxed">{tab.displayDetails}</p>
          </Section>
        </div>

        {/* Notes */}
        <div className="bg-[#13152a] border border-slate-800 rounded-lg p-6">
          <SectionTitle title="Notes" />
          <p className="text-sm text-slate-500 italic mt-1">
            {tab.notes || 'No notes yet — add context, decisions, or discussion points here.'}
          </p>
        </div>

      </div>
    </div>
  )
}