'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RefreshButton() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 1500)
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border border-slate-700 text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-all disabled:opacity-50"
    >
      <span className={refreshing ? 'animate-spin' : ''}>↻</span>
      {refreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  )
}