import { useEffect, useRef, useState } from 'react'
import type { ReactNode, PointerEvent } from 'react'

type Point = { x: number; y: number }
type Bounds = { left: number; right: number; top: number; bottom: number }

export default function BoardViewport({ children, home, startBounds, vertical, resetKey }: {
  children: ReactNode; home: Point; startBounds: Bounds; vertical: boolean; resetKey: string
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, Point>())
  const dragged = useRef(false)
  const origin = useRef<Point>({ x: 0, y: 0 })
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 })
  const homeRef = useRef(home)
  useEffect(() => { homeRef.current = home }, [home])
  const startRef = useRef(startBounds)
  useEffect(() => { startRef.current = startBounds }, [startBounds])

  function center() {
    const rect = viewport.current!.getBoundingClientRect()
    setCamera({ x: rect.width / 2 - homeRef.current.x, y: rect.height / 3 - homeRef.current.y, zoom: 1 })
  }
  useEffect(() => {
    const element = viewport.current!
    function frameStarts() {
      const rect = element.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const bounds = startRef.current
      const zoom = Math.min(1, (rect.width - 32) / (bounds.right - bounds.left),
        (rect.height - 48) / (bounds.bottom - bounds.top))
      setCamera({
        x: vertical ? rect.width / 2 - (bounds.left + bounds.right) / 2 * zoom : 16 - bounds.left * zoom,
        y: 16 - bounds.top * zoom,
        zoom,
      })
      pointers.current.clear()
    }
    frameStarts()
    const observer = new ResizeObserver(frameStarts)
    observer.observe(element)
    return () => observer.disconnect()
  }, [resetKey, vertical])

  function zoom(factor: number, point?: Point) {
    const rect = viewport.current!.getBoundingClientRect()
    const anchor = point ?? { x: rect.width / 2, y: rect.height / 2 }
    setCamera((current) => {
      const next = Math.max(0.5, Math.min(2.5, current.zoom * factor))
      const ratio = next / current.zoom
      return { x: anchor.x - (anchor.x - current.x) * ratio,
        y: anchor.y - (anchor.y - current.y) * ratio, zoom: next }
    })
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    const next = { x: event.clientX, y: event.clientY }
    const others = [...pointers.current.entries()].filter(([id]) => id !== event.pointerId)
    if (others.length) {
      dragged.current = true
      const other = others[0][1]
      const before = Math.hypot(previous.x - other.x, previous.y - other.y)
      const after = Math.hypot(next.x - other.x, next.y - other.y)
      const rect = viewport.current!.getBoundingClientRect()
      const a = { x: (previous.x + other.x) / 2 - rect.left, y: (previous.y + other.y) / 2 - rect.top }
      const b = { x: (next.x + other.x) / 2 - rect.left, y: (next.y + other.y) / 2 - rect.top }
      setCamera((current) => {
        const nextZoom = Math.max(0.5, Math.min(2.5, current.zoom * after / Math.max(1, before)))
        const ratio = nextZoom / current.zoom
        return { x: b.x - (a.x - current.x) * ratio, y: b.y - (a.y - current.y) * ratio, zoom: nextZoom }
      })
    } else {
      if (Math.hypot(next.x - origin.current.x, next.y - origin.current.y) > 6) dragged.current = true
      if (dragged.current) {
        event.currentTarget.setPointerCapture(event.pointerId)
        setCamera((current) => ({ ...current, x: current.x + next.x - previous.x, y: current.y + next.y - previous.y }))
      }
    }
    pointers.current.set(event.pointerId, next)
  }

  return <div className="board-area">
    <div ref={viewport} className="board-viewport" aria-label="Game board. Drag to pan, pinch to zoom."
      onPointerDown={(event) => {
        if (event.button !== 0) return
        if (!pointers.current.size) dragged.current = false
        origin.current = { x: event.clientX, y: event.clientY }
        pointers.current.set(event.pointerId, origin.current)
      }}
      onPointerMove={move}
      onPointerUp={(event) => pointers.current.delete(event.pointerId)}
      onPointerCancel={(event) => pointers.current.delete(event.pointerId)}
      onPointerLeave={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) pointers.current.delete(event.pointerId) }}
      onClickCapture={(event) => { if (dragged.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation() } }}
      onWheel={(event) => {
        const rect = viewport.current!.getBoundingClientRect()
        zoom(Math.exp(-event.deltaY * 0.002), { x: event.clientX - rect.left, y: event.clientY - rect.top })
      }}>
      <div className="board-camera" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}>
        {children}
      </div>
    </div>
    <div className="board-tools" aria-label="Board view controls">
      <button className="secondary" aria-label="Zoom out" onClick={() => zoom(1 / 1.25)}>−</button>
      <button className="secondary" aria-label="Zoom in" onClick={() => zoom(1.25)}>+</button>
      <button className="secondary" onClick={center}>My piece</button>
    </div>
  </div>
}
