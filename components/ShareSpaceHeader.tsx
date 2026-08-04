"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Room } from "@/lib/types"

interface RoomHeaderProps {
  room: Room
}

export default function RoomHeader({ room }: RoomHeaderProps) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = Date.now()
      const expiresAt = room.expiresAt
      const diff = expiresAt - now

      if (diff <= 0) {
        setTimeLeft("Expired")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      )
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [room.expiresAt])

  const copyRoomUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push("/")
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#02050c]/80 backdrop-blur-xl border-b border-slate-900/60 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-10"
    >
      <div className="max-w-7xl px-4 mx-auto flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={goBack} aria-label="Go back" className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#232B36] bg-[#131A22] text-slate-300 transition hover:border-[#6AA5FF] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6AA5FF]"><ArrowLeft className="size-4" /></button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Space <span className="text-[#6AA5FF] font-mono">{room.id.toUpperCase()}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Expires in:</span>
              <span className="text-[#6EE7C8] font-mono font-semibold tracking-wider">{timeLeft}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={copyRoomUrl}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-[#4F8CFF] hover:bg-[#6AA5FF] text-white px-3 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-[#4F8CFF]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6AA5FF]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>{copied ? "Copied!" : "Share Link"}</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  )
}
