'use client'

import { useRef, useState } from 'react'

interface Props {
  src: string
}

export default function MapViewer({ src }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    setPos(p => ({ x: p.x + dx, y: p.y + dy }))
  }

  function onMouseUp() { dragging.current = false }
  function onMouseLeave() { dragging.current = false }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    setScale(s => Math.min(3, Math.max(0.3, s - e.deltaY * 0.001)))
  }

  function resetView() {
    setPos({ x: 0, y: 0 })
    setScale(1)
  }

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-400 bg-[#13152a] w-[1200px]">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={() => setScale(s => Math.min(3, s + 0.2))}
          className="w-8 h-8 bg-[#0a0b14] border border-slate-700 rounded text-slate-300 hover:text-white hover:border-slate-500 text-lg font-bold transition-colors flex items-center justify-center"
        >+</button>
        <button
          onClick={() => setScale(s => Math.max(0.3, s - 0.2))}
          className="w-8 h-8 bg-[#0a0b14] border border-slate-700 rounded text-slate-300 hover:text-white hover:border-slate-500 text-lg font-bold transition-colors flex items-center justify-center"
        >−</button>
        <button
          onClick={resetView}
          className="px-2 h-8 bg-[#0a0b14] border border-slate-700 rounded text-slate-300 hover:text-white hover:border-slate-500 text-xs transition-colors"
        >Reset</button>
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 left-3 z-10 text-xs text-slate-500 pointer-events-none">
        Drag to pan · Scroll to zoom
      </div>

      {/* Map canvas */}
        <div
        ref={containerRef}
        className="w-[1200px] overflow-hidden"
        style={{ height: '520px', cursor: dragging.current ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onWheel={onWheel}
      >
        <img
          src={src}
          alt="Exacta Properties Map"
          draggable={false}
          style={{
            display: 'block',
            width: '100%',
            transformOrigin: 'center center',
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: dragging.current ? 'none' : 'transform 0.1s ease',
            userSelect: 'none',
          }}
        />
      </div>
    </div>
  )
}