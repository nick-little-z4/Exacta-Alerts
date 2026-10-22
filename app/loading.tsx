export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0b14] flex flex-col items-center justify-center gap-4">
      <div
        className="h-12 w-12 rounded-full border-4 border-slate-700 border-t-orange-400 animate-spin"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm text-slate-400">Loading, please wait...</p>
    </div>
  )
}