"use client"

import { Circle, Download, Eraser, Highlighter, Minus, Pencil, Redo2, RotateCcw, Square, Undo2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { WhiteboardElement } from "@/lib/types"

const tools = [["pencil", Pencil], ["highlighter", Highlighter], ["eraser", Eraser], ["rectangle", Square], ["circle", Circle], ["line", Minus]] as const
const isShape = (value: unknown): value is WhiteboardElement => typeof value === "object" && value !== null && "tool" in value && "points" in value && Array.isArray((value as WhiteboardElement).points)

/** Repairs malformed/restored payloads; existing distinct IDs are never changed. */
export function validateShapes(shapes: unknown): WhiteboardElement[] {
  if (!Array.isArray(shapes)) return []
  const ids = new Set<string>()
  return shapes.filter(isShape).map((shape) => {
    const id = typeof shape.id === "string" && shape.id.length > 0 && !ids.has(shape.id) ? shape.id : crypto.randomUUID()
    ids.add(id)
    return { ...shape, id, points: shape.points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)) }
  })
}

export default function Whiteboard({ spaceId, password }: { spaceId: string; password: string }) {
  const [elements, setElements] = useState<WhiteboardElement[]>([])
  const [tool, setTool] = useState<WhiteboardElement["tool"]>("pencil")
  const [color, setColor] = useState("#6AA5FF")
  const [width, setWidth] = useState(4)
  const [redo, setRedo] = useState<WhiteboardElement[]>([])
  const drawing = useRef<WhiteboardElement | null>(null)
  const elementsRef = useRef<WhiteboardElement[]>([])
  const requestHeaders = useCallback(() => password ? { "x-room-password": password } : {}, [password])

  const commit = useCallback((next: WhiteboardElement[], persist = true) => {
    const valid = validateShapes(next)
    elementsRef.current = valid
    setElements(valid)
    if (persist) fetch(`/api/rooms/${spaceId}/whiteboard`, { method: "PUT", headers: { "Content-Type": "application/json", ...requestHeaders() }, body: JSON.stringify(valid) }).catch(() => undefined)
  }, [requestHeaders, spaceId])

  useEffect(() => {
    const load = () => fetch(`/api/rooms/${spaceId}/whiteboard`, { headers: requestHeaders() })
      .then((response) => response.ok ? response.json() : [])
      .then((remote) => { if (!drawing.current) commit(remote, false) })
      .catch(() => undefined)
    load(); const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
  }, [commit, requestHeaders, spaceId])

  const point = (event: React.PointerEvent<SVGSVGElement>) => { const box = event.currentTarget.getBoundingClientRect(); return { x: ((event.clientX - box.left) / box.width) * 1000, y: ((event.clientY - box.top) / box.height) * 600 } }
  const path = (item: WhiteboardElement) => item.points.map((p, index) => `${index ? "L" : "M"}${p.x} ${p.y}`).join(" ")
  const exportSvg = () => { const svg = document.querySelector("#space-board")?.outerHTML; if (!svg) return; const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); const link = document.createElement("a"); link.href = url; link.download = "zerologin-board.svg"; link.click(); URL.revokeObjectURL(url) }
  // `elements` is normalized at every state ingress; rendering never creates IDs.
  const displayed = elements

  return <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6"><div className="overflow-hidden rounded-2xl border border-[#232B36] bg-[#131A22]"><div className="flex flex-wrap items-center gap-2 border-b border-[#232B36] p-3">{tools.map(([name, Icon]) => <button key={name} onClick={() => setTool(name)} aria-label={name} className={`grid size-9 place-items-center rounded-lg ${tool === name ? "bg-[#4F8CFF] text-white" : "text-slate-400 hover:bg-white/5"}`}><Icon className="size-4" /></button>)}<input aria-label="Brush color" type="color" value={color} onChange={(event) => setColor(event.target.value)} className="ml-1 size-9 rounded bg-transparent" /><input aria-label="Brush thickness" type="range" min="1" max="20" value={width} onChange={(event) => setWidth(+event.target.value)} className="w-20 accent-[#4F8CFF]" /><span className="text-xs text-[#94A3B8]">{width}px</span><div className="ml-auto flex gap-1"><button onClick={() => { const item = elementsRef.current.at(-1); if (item) { setRedo((history) => [item, ...history]); commit(elementsRef.current.slice(0, -1)) } }} aria-label="Undo" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5"><Undo2 className="size-4" /></button><button onClick={() => { const item = redo[0]; if (item && !elementsRef.current.some((shape) => shape.id === item.id)) { setRedo((history) => history.slice(1)); commit([...elementsRef.current, item]) } }} aria-label="Redo" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5"><Redo2 className="size-4" /></button><button onClick={() => { setRedo([]); commit([]) }} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs text-red-300 hover:bg-red-500/10"><RotateCcw className="size-4" /> Clear</button><button onClick={exportSvg} className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#4F8CFF] px-2 text-xs font-medium"><Download className="size-4" /> SVG</button></div></div><div className="aspect-[5/3] min-h-[300px] bg-[linear-gradient(#232B36_1px,transparent_1px),linear-gradient(90deg,#232B36_1px,transparent_1px)] bg-[size:24px_24px]"><svg id="space-board" viewBox="0 0 1000 600" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drawing.current = { id: crypto.randomUUID(), tool, color: tool === "eraser" ? "#131A22" : color, width, points: [point(event)] }; setElements([...elementsRef.current]) }} onPointerMove={(event) => { if (drawing.current) { drawing.current = { ...drawing.current, points: [...drawing.current.points, point(event)] }; setElements([...elementsRef.current]) } }} onPointerUp={() => { if (drawing.current) { const finished = drawing.current; drawing.current = null; setRedo([]); commit([...elementsRef.current, finished]) } }} className="h-full w-full touch-none cursor-crosshair">{displayed.map((item) => item.tool === "circle" ? <ellipse key={item.id} cx={item.points[0]?.x} cy={item.points[0]?.y} rx={Math.abs((item.points.at(-1)?.x || 0) - item.points[0].x)} ry={Math.abs((item.points.at(-1)?.y || 0) - item.points[0].y)} fill="none" stroke={item.color} strokeWidth={item.width} /> : item.tool === "rectangle" ? <rect key={item.id} x={item.points[0]?.x} y={item.points[0]?.y} width={(item.points.at(-1)?.x || 0) - item.points[0].x} height={(item.points.at(-1)?.y || 0) - item.points[0].y} fill="none" stroke={item.color} strokeWidth={item.width} /> : <path key={item.id} d={path(item)} fill="none" stroke={item.color} strokeWidth={item.width} strokeOpacity={item.tool === "highlighter" ? .4 : 1} strokeLinecap="round" strokeLinejoin="round" />)}</svg></div><p className="px-4 py-3 text-xs text-[#94A3B8]">Auto-saved and refreshed every 4 seconds. This command-based board can be connected to WebSockets without changing its drawing model.</p></div></div>
}
