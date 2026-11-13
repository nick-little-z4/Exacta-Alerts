'use client'

/**
 * TV mode: shows the dashboard pages like slides, one after another.
 *
 * - <TvModeToggle /> on the home page starts it (jumps straight to the first tab).
 * - <TvModeRunner seconds={...} /> in app/layout.tsx runs on every page: moves to
 *   the next page every `seconds` (set by TV_SECONDS_PER_PAGE on the server,
 *   default 30) and hides page chrome so only the content shows.
 * - Right / left arrow: next / previous page.
 * - Exit: click anywhere or press any other key (Esc included).
 *
 * On/off is saved in this browser only (localStorage), so a wall TV stays in
 * TV mode after a reload, and nobody else is affected.
 *
 * Long pages scroll slowly from top to bottom during their slide, so nothing is cut off.
 *
 * Page chrome hidden in TV mode (see globals.css): back links, "How to read this
 * page", footers, "Updated" labels and tooltips, and anything marked data-tv-hide.
 */

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { tabs } from '@/lib/tabs'

function pageLabel(path: string) {
  if (path === '/') return 'Home'
  const slug = path.replace('/tabs/', '')
  return tabs.find(t => t.slug === slug)?.title ?? slug
}

const STORAGE_KEY = 'exacta-tv-mode'
const CHANGE_EVENT = 'exacta-tv-mode-change'

// Tabs left out of TV mode
const TV_EXCLUDE = ['zero-takeout-monitor']

// Every other tab in the order of lib/tabs.ts (the home page isn't part of the cycle)
export const TV_PAGES = tabs.filter(t => !TV_EXCLUDE.includes(t.slug)).map(t => `/tabs/${t.slug}`)

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

function writeEnabled(on: boolean) {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, 'on')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function useTvEnabled(): boolean {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const sync = () => setEnabled(readEnabled())
    sync()
    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  return enabled
}

/** Home page button: starts TV mode and goes straight to the next page. */
export function TvModeToggle() {
  const router = useRouter()
  const start = () => {
    writeEnabled(true)
    router.push(TV_PAGES[0])
  }
  return (
    <button
      data-tv-hide
      onClick={start}
      className="text-xs px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 hover:border-orange-400 hover:text-orange-300 transition-colors"
    >
      📺 TV Mode
    </button>
  )
}

/** Runs on every page (in app/layout.tsx). */
export function TvModeRunner({ seconds }: { seconds: number }) {
  const enabled = useTvEnabled()
  const pathname = usePathname()
  const router = useRouter()

  const pages = TV_PAGES

  // On a page outside the cycle (e.g. home), the next stop is the first tab
  const index = pages.indexOf(pathname)
  const next = pages[(index + 1) % pages.length]
  const prev = pages[(index - 1 + pages.length) % pages.length]

  const exit = useCallback(() => writeEnabled(false), [])

  // Mark the page so globals.css can hide chrome and the cursor
  useEffect(() => {
    if (enabled) document.documentElement.setAttribute('data-tv', 'on')
    else document.documentElement.removeAttribute('data-tv')
    return () => document.documentElement.removeAttribute('data-tv')
  }, [enabled])

  // Next page after `seconds`; restarts on every page change
  useEffect(() => {
    if (!enabled) return
    router.prefetch(next)
    const t = setTimeout(() => router.push(next), seconds * 1000)
    return () => clearTimeout(t)
  }, [enabled, seconds, pathname, next, router])

  // Auto scroll: start at the top, hold, scroll slowly to the bottom, hold.
  // Pages that already fit on screen don't move.
  useEffect(() => {
    if (!enabled) return
    window.scrollTo(0, 0)
    const holdMs = Math.min(4000, seconds * 1000 * 0.15)   // pause at top and bottom
    const scrollMs = seconds * 1000 - holdMs * 2
    let frame = 0
    let startAt = 0
    const begin = setTimeout(() => {
      const distance = document.documentElement.scrollHeight - window.innerHeight
      if (distance <= 20 || scrollMs <= 0) return
      const step = (now: number) => {
        if (!startAt) startAt = now
        const t = Math.min(1, (now - startAt) / scrollMs)
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2  // smooth start and stop
        window.scrollTo(0, distance * eased)
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }, holdMs)
    return () => {
      clearTimeout(begin)
      cancelAnimationFrame(frame)
    }
  }, [enabled, seconds, pathname])

  // Any click or key exits. Small delay so the click that started TV mode doesn't stop it.
  useEffect(() => {
    if (!enabled) return
    let armed = false
    const arm = setTimeout(() => { armed = true }, 1000)
    const stop = () => { if (armed) exit() }
    // Right arrow: next page. Left arrow: previous page. Any other key exits.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); router.push(next); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); router.push(prev); return }
      stop()
    }
    window.addEventListener('click', stop, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      clearTimeout(arm)
      window.removeEventListener('click', stop, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [enabled, exit, next, prev, router])

  if (!enabled) return null

  // Thin progress bar along the bottom, like a slide timer, plus a subtle exit hint
  return (
    <>
      {/* Which slide this is */}
      <div className="fixed bottom-3 left-4 z-[100] pointer-events-none text-xs text-slate-300 bg-[#0a0b14]/80 border border-slate-800 rounded-full px-3 py-1 flex items-center gap-2">
        {index >= 0 && <span className="font-semibold tabular-nums text-orange-400">{index + 1} / {pages.length}</span>}
        <span className="text-slate-600">·</span>
        <span>{pageLabel(pathname)}</span>
      </div>
      <div
        className="fixed bottom-3 right-4 z-[100] pointer-events-none text-[11px] tracking-wide text-slate-400 bg-[#0a0b14]/70 border border-slate-800 rounded-full px-3 py-1"
        style={{ animation: 'tv-hint 3s ease-in-out infinite' }}
      >
        ← → to change page · Esc or click to exit
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-1 z-[100] bg-slate-900/60 pointer-events-none">
        <div
          key={pathname}
          className="h-full bg-gradient-to-r from-orange-400 to-pink-500"
          style={{ animation: `tv-progress ${seconds}s linear forwards` }}
        />
      </div>
    </>
  )
}