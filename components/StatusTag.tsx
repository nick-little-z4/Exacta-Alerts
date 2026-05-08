import { TabStatus } from '@/lib/tabs'

const config: Record<TabStatus, { label: string; className: string }> = {
  ready: { label: 'Data Ready', className: 'bg-green-100 text-green-800' },
  'needs-work': { label: 'Needs Work', className: 'bg-yellow-100 text-yellow-800' },
  blocked: { label: 'Blocked', className: 'bg-red-100 text-red-800' },
}

export default function StatusTag({ status }: { status: TabStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${className}`}>
      {label}
    </span>
  )
}