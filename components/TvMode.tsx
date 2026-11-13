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
 * Pages with sub-tabs (buttons marked data-tv-subtab, e.g. Low Pools / Roulette Graph)
 * show each sub-tab for a full slide before moving on. The label shows the sub-tab
 * name: data-tv-subtab="Roulette" sets it, otherwise the button text is used.
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

// Length of each half of the cross fade between pages
const FADE_MS = 400

const STORAGE_KEY = 'exacta-tv-mode'
const CHANGE_EVENT = 'exacta-tv-mode-change'
const START_EVENT = 'exacta-tv-mode-start'

// Tabs left out of TV mode
const TV_EXCLUDE = ['zero-takeout-monitor']

// Every other tab in the order of lib/tabs.ts, then the home page last as the
// badge summary (last, so starting TV mode from home moves on right away)
export const TV_PAGES = [
  ...tabs.filter(t => !TV_EXCLUDE.includes(t.slug)).map(t => `/tabs/${t.slug}`),
  '/',
]

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
    window.dispatchEvent(new Event(START_EVENT))
    // Wait for the runner's fade to dark, then switch to the first page
    setTimeout(() => router.push(TV_PAGES[0]), FADE_MS + 20)
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

  // On a page outside the cycle, the next stop is the first tab
  const index = pages.indexOf(pathname)
  const next = pages[(index + 1) % pages.length]
  const prev = pages[(index - 1 + pages.length) % pages.length]

  const exit = useCallback(() => writeEnabled(false), [])

  // Cross fade between pages: cover, switch, uncover
  const [covering, setCovering] = useState(false)
  const go = useCallback((path: string) => {
    setCovering(true)
    setTimeout(() => router.push(path), FADE_MS)
  }, [router])
  useEffect(() => {
    // New page is in: fade the cover back out
    const t = setTimeout(() => setCovering(false), 50)
    return () => clearTimeout(t)
  }, [pathname])

  // Entering TV mode fades too: the TV Mode button asks for the cover
  // (a reload of a TV already in TV mode doesn't, so the page isn't hidden)
  useEffect(() => {
    // Small delay so the cover mounts see-through first, then fades to dark
    const cover = () => { setTimeout(() => setCovering(true), 20) }
    window.addEventListener(START_EVENT, cover)
    return () => window.removeEventListener(START_EVENT, cover)
  }, [])

  // /tv/activate sends the TV to /?tvstart=1: turn TV mode on and go to the first page
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tvstart') === '1') {
      writeEnabled(true)
      setTimeout(() => setCovering(true), 20)
      setTimeout(() => router.replace(TV_PAGES[0]), FADE_MS + 20)
    }
  }, [router])

  // Mark the page so globals.css can hide chrome and the cursor
  useEffect(() => {
    if (enabled) document.documentElement.setAttribute('data-tv', 'on')
    else document.documentElement.removeAttribute('data-tv')
    return () => document.documentElement.removeAttribute('data-tv')
  }, [enabled])

  // How many sub-tabs this page has (buttons marked data-tv-subtab). Each one gets
  // its own full slide time; the progress bar covers the whole page.
  const [segments, setSegments] = useState(1)
  // Name of the sub-tab being shown, for the page label (e.g. "Pool Monitor")
  const [subLabel, setSubLabel] = useState<string | null>(null)

  // Slide sequence for the current page: for each sub-tab (or once if none),
  // click it, start at the top, hold, scroll slowly to the bottom, hold.
  // Then go to the next page. Restarts on every page change.
  useEffect(() => {
    if (!enabled) return
    router.prefetch(next)

    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    let frame = 0
    const holdMs = Math.min(4000, seconds * 1000 * 0.15)
    const scrollMs = seconds * 1000 - holdMs * 2

    const scrollDown = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight
      if (distance <= 20 || scrollMs <= 0) return
      let startAt = 0
      const step = (now: number) => {
        if (cancelled) return
        if (!startAt) startAt = now
        const t = Math.min(1, (now - startAt) / scrollMs)
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        window.scrollTo(0, distance * eased)
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }

    // Give the page a moment to render before looking for sub-tabs
    timers.push(setTimeout(() => {
      if (cancelled) return
      const subtabs = Array.from(document.querySelectorAll<HTMLElement>('[data-tv-subtab]'))
      const count = Math.max(1, subtabs.length)
      setSegments(count)

      const runSegment = (i: number) => {
        if (cancelled) return
        if (i >= count) {
          go(next)
          return
        }
        if (subtabs[i]) {
          subtabs[i].click()
          // Label: the attribute's value if set (data-tv-subtab="Roulette"), else the button text
          const name = subtabs[i].getAttribute('data-tv-subtab') || subtabs[i].textContent || ''
          setSubLabel(name.trim() || null)
        }
        cancelAnimationFrame(frame)
        window.scrollTo(0, 0)
        timers.push(setTimeout(scrollDown, holdMs))
        timers.push(setTimeout(() => runSegment(i + 1), seconds * 1000))
      }
      runSegment(0)
    }, 300))

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      cancelAnimationFrame(frame)
      setSegments(1)
      setSubLabel(null)
    }
  }, [enabled, seconds, pathname, next, router, go])

  // Any click or key exits. Small delay so the click that started TV mode doesn't stop it.
  useEffect(() => {
    if (!enabled) return
    let armed = false
    const arm = setTimeout(() => { armed = true }, 1000)
    // e.isTrusted: ignore the runner's own sub-tab clicks
    const stop = (e?: Event) => { if (armed && (!e || e.isTrusted)) exit() }
    // Right arrow: next page. Left arrow: previous page. Any other key exits.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(next); return }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(prev); return }
      stop(e)
    }
    window.addEventListener('click', stop, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      clearTimeout(arm)
      window.removeEventListener('click', stop, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [enabled, exit, next, prev, go])

  if (!enabled) return null

  // Thin progress bar along the bottom, like a slide timer, plus a subtle exit hint.
  return (
    <>
      {/* Cross fade: fades to dark, switches page, fades the new page in */}
      <div
        className="fixed inset-0 z-[110] pointer-events-none bg-[#0a0b14] transition-opacity ease-in-out"
        style={{ opacity: covering ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
      />
      {/* Which slide this is */}
      <div className="fixed bottom-3 left-4 z-[100] pointer-events-none text-xs text-slate-300 bg-[#0a0b14]/80 border border-slate-800 rounded-full px-3 py-1 flex items-center gap-2">
        {index >= 0 && <span className="font-semibold tabular-nums text-orange-400">{index + 1} / {pages.length}</span>}
        <span className="text-slate-600">·</span>
        <span>{pageLabel(pathname)}{subLabel ? ` - ${subLabel}` : ''}</span>
      </div>
      <div
        className="fixed bottom-3 right-4 z-[100] pointer-events-none text-[11px] tracking-wide text-slate-400 bg-[#0a0b14]/70 border border-slate-800 rounded-full px-3 py-1"
        style={{ animation: 'tv-hint 3s ease-in-out infinite' }}
      >
        ← → to change page · Esc or click to exit
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-1 z-[100] bg-slate-900/60 pointer-events-none">
        <div
          key={`${pathname}-${segments}`}
          className="h-full bg-gradient-to-r from-orange-400 to-pink-500"
          style={{ animation: `tv-progress ${seconds * segments}s linear forwards` }}
        />
      </div>
    </>
  )
}