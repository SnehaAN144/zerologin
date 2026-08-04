"use client"

import { ChevronDown, KeyRound, LoaderCircle, Settings2, Timer } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import type { Room } from "@/lib/types"

const durations = [
  { value: "15m", label: "15 minutes" }, { value: "1h", label: "1 hour" }, { value: "6h", label: "6 hours" }, { value: "24h", label: "24 hours" },
]

export default function SpaceSettings({ room, roomPassword, onUpdated }: { room: Room; roomPassword: string; onUpdated: (room: Room, password: string) => void }) {
  const [open, setOpen] = useState(false)
  const [expiry, setExpiry] = useState("24h")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const save = async () => {
    setSaving(true); setMessage(null)
    try {
      const response = await fetch(`/api/rooms/${room.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(roomPassword ? { "x-room-password": roomPassword } : {}) }, body: JSON.stringify({ expiry, password: password.trim() }), cache: "no-store" })
      const data = await response.json().catch(() => ({ error: "Unable to update space settings." }))
      if (!response.ok) throw new Error(data.error)
      if (password.trim()) sessionStorage.setItem(`room-pwd-${room.id}`, password.trim())
      onUpdated(data, password.trim() || roomPassword)
      setPassword("")
      setMessage("Settings saved.")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update settings.") } finally { setSaving(false) }
  }

  return <section className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6"><div className="overflow-hidden rounded-2xl border border-[#232B36] bg-[#131A22]/80 shadow-xl shadow-black/10"><button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#4F8CFF]/10 text-[#6AA5FF]"><Settings2 className="size-4" /></span><span><span className="block text-sm font-semibold text-[#F5F7FA]">Space Settings</span><span className="mt-0.5 block text-xs text-[#94A3B8]">Set expiry and access protection</span></span></span><ChevronDown className={`size-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} /></button><AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="grid gap-5 border-t border-[#232B36] p-4 sm:grid-cols-2 sm:p-5"><label className="space-y-2"><span className="flex items-center gap-2 text-sm font-medium text-slate-200"><Timer className="size-4 text-[#6EE7C8]" /> Expiration Duration</span><select value={expiry} onChange={(event) => setExpiry(event.target.value)} className="h-11 w-full rounded-xl border border-[#232B36] bg-[#0B0F14] px-3 text-sm text-[#F5F7FA] outline-none focus:border-[#4F8CFF]">{durations.map((duration) => <option key={duration.value} value={duration.value}>{duration.label}</option>)}</select><span className="block text-xs text-[#94A3B8]">Time starts when these settings are saved.</span></label><label className="space-y-2"><span className="flex items-center gap-2 text-sm font-medium text-slate-200"><KeyRound className="size-4 text-[#6EE7C8]" /> Password Protection</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Leave blank to keep current access" className="h-11 w-full rounded-xl border border-[#232B36] bg-[#0B0F14] px-3 text-sm text-[#F5F7FA] outline-none placeholder:text-slate-600 focus:border-[#4F8CFF]" /><span className="block text-xs text-[#94A3B8]">Choose a password to protect this space.</span></label><div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3"><p role="status" className={`text-xs ${message?.includes("saved") ? "text-[#6EE7C8]" : "text-[#EF4444]"}`}>{message}</p><button onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#4F8CFF] px-4 text-sm font-semibold text-white transition hover:bg-[#6AA5FF] disabled:opacity-50">{saving && <LoaderCircle className="size-4 animate-spin" />}Save Settings</button></div></div></motion.div>}</AnimatePresence></div></section>
}
