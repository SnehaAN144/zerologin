"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import RoomHeader from "@/components/ShareSpaceHeader"
import ContentGrid from "@/components/ContentGrid"
import ContentInput from "@/components/ContentEnter"
import SpaceSettings from "@/components/SpaceSettings"
import Whiteboard from "@/components/Whiteboard"
import { useRoomStore } from "@/store/roomStore"
import type { Room } from "@/lib/types"

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  // State variables
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)

  // Password Protection States
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [roomPassword, setRoomPassword] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"content" | "whiteboard">("content")

  const { messages, setMessages, addMessage } = useRoomStore()

  // Helper to load room details with the given password
  const loadRoomDetails = async (pwd: string) => {
    try {
      setLoading(true)
      setError(null)
      setPasswordError(null)

      const headers: HeadersInit = {
        "Cache-Control": "no-cache",
      }
      if (pwd) {
        headers["x-room-password"] = pwd
      }

      console.log(`🔍 Fetching room: ${roomId}`)
      const response = await fetch(`/api/rooms/${roomId}`, {
        cache: "no-store",
        headers,
      })

      console.log(`📡 Room fetch response status: ${response.status}`)

      if (response.ok) {
        const roomData = await response.json()
        console.log("✅ Room data received:", roomData)
        setRoom(roomData)
        setRoomPassword(pwd)
        setPasswordRequired(false)
        setError(null)
      } else if (response.status === 401) {
        // Password required or incorrect
        setPasswordRequired(true)
        if (pwd) {
          setPasswordError("Incorrect password. Please try again.")
        }
      } else if (response.status === 404) {
        const errorData = await response.json().catch(() => ({ error: "Room not found" }))
        console.error("❌ Room not found:", errorData.error)
        setError(errorData.error || "Room not found or has expired")
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("❌ Failed to load room:", errorData)
        setError(errorData.error || "Failed to load room")
      }
    } catch (err) {
      console.error("❌ Error fetching room:", err)
      setError("Network error. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  // Load room on mount
  useEffect(() => {
    // Check if the password is saved in sessionStorage (e.g., if creator or reloaded)
    const savedPassword = sessionStorage.getItem(`room-pwd-${roomId}`) || ""
    void Promise.resolve().then(() => loadRoomDetails(savedPassword))
  // The request intentionally reloads only when the route changes; the helper closes over that route ID.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  // Handle password prompt submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordInput.trim().length > 0) {
      // Save password temporarily in sessionStorage for reload persistence
      sessionStorage.setItem(`room-pwd-${roomId}`, passwordInput.trim())
      loadRoomDetails(passwordInput.trim())
    } else {
      setPasswordError("Password cannot be empty.")
    }
  }

  // Separate effect to start content polling when room becomes available
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    let mounted = true

    if (room) {
      console.log("🚀 Starting content polling for room:", room.id)

      const fetchContent = async () => {
        if (!mounted) return

        try {
          console.log(`📨 Polling content for room: ${roomId}`)
          setContentLoading(true)

          const headers: HeadersInit = {
            "Cache-Control": "no-cache",
          }
          if (roomPassword) {
            headers["x-room-password"] = roomPassword
          }

          const response = await fetch(`/api/rooms/${roomId}/messages`, {
            cache: "no-store",
            headers,
          })

          if (!mounted) return

          if (response.ok) {
            const contentData = await response.json()
            if (Array.isArray(contentData)) {
              setMessages(contentData)
              console.log(`🔄 Polled ${contentData.length} items`)
            }
          } else {
            console.log(`⚠️ Content polling failed with status: ${response.status}`)
          }
        } catch (err) {
          console.error("❌ Error during content polling:", err)
        } finally {
          if (mounted) {
            setContentLoading(false)
          }
        }
      }

      // Initial fetch
      fetchContent()

      // Set up polling
      interval = setInterval(fetchContent, 3000)
    }

    return () => {
      mounted = false
      if (interval) {
        console.log("🛑 Stopping content polling")
        clearInterval(interval)
      }
    }
  }, [room, roomId, roomPassword, setMessages])

  const handleSubmitContent = async (
    content: string,
    type: "text" | "image" | "pdf" | "file",
    fileName?: string,
    fileSize?: number,
    fileType?: string,
  ) => {
    try {
      console.log(`📤 Sending ${type} content to room ${roomId}`)

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }
      if (roomPassword) {
        headers["x-room-password"] = roomPassword
      }

      const response = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content,
          type,
          fileName,
          fileSize,
          fileType,
        }),
      })

      if (response.ok) {
        const newContent = await response.json()
        console.log("✅ Content shared successfully:", newContent.id)
        addMessage(newContent)
      } else {
        console.error("❌ Failed to share content:", response.status)
        const errorText = await response.text().catch(() => "Unknown error")
        console.error("❌ Share content error:", errorText)
      }
    } catch (err) {
      console.error("❌ Error sharing content:", err)
    }
  }

  const handleCreateNewRoom = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02050c] flex items-center justify-center text-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading space...</p>
          <p className="text-xs text-slate-500 mt-2">Space ID: {roomId.toUpperCase()}</p>
        </div>
      </div>
    )
  }

  // 1. Password Prompt Screen
  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-[#02050c] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-sm p-8 bg-[#070c19]/50 border border-blue-500/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        >
          <div className="w-16 h-16 bg-blue-950/30 border border-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(0,191,255,0.15)] text-cyan-400">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Protected</h2>
          <p className="text-slate-400 text-xs mb-6">You need a password to access this space: <span className="font-mono text-cyan-400">{roomId.toUpperCase()}</span></p>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter space password"
              autoFocus
              className="w-full px-4 py-2.5 bg-black/40 border border-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-slate-100 placeholder-slate-700 text-sm text-center"
            />
            {passwordError && (
              <p className="text-xs text-red-400 text-left font-medium">{passwordError}</p>
            )}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleCreateNewRoom}
                className="flex-1 px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-xl text-xs text-slate-400 font-semibold transition-colors cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl text-xs shadow-[0_0_15px_rgba(0,191,255,0.2)] transition-all cursor-pointer"
              >
                Enter Space
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#02050c] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8 bg-[#070c19]/50 border border-red-500/20 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.05)]"
        >
          <div className="w-16 h-16 bg-red-950/30 border border-red-900/50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Space Not Found</h2>
          <p className="text-red-400 mb-3 text-sm">{error}</p>
          <p className="text-xs text-slate-500 mb-6">Space ID: {roomId.toUpperCase()}</p>
          <button
            onClick={handleCreateNewRoom}
            className="w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(0,191,255,0.2)] cursor-pointer"
          >
            Create New Space
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#02050c] text-slate-100 flex flex-col">
      <RoomHeader room={room!} />
      <SpaceSettings room={room!} roomPassword={roomPassword} onUpdated={(updatedRoom, updatedPassword) => { setRoom(updatedRoom); setRoomPassword(updatedPassword) }} />

      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full overflow-hidden border-x border-slate-900/50 bg-[#040814]/30">
        <div className="flex border-b border-[#232B36] px-4"><button onClick={() => setActiveTab("content")} className={`px-4 py-3 text-sm font-medium ${activeTab === "content" ? "border-b-2 border-[#4F8CFF] text-white" : "text-slate-400"}`}>Content</button><button onClick={() => setActiveTab("whiteboard")} className={`px-4 py-3 text-sm font-medium ${activeTab === "whiteboard" ? "border-b-2 border-[#4F8CFF] text-white" : "text-slate-400"}`}>Whiteboard</button></div>
        {activeTab === "content" ? <><div className="flex-1 overflow-hidden"><ContentGrid items={messages} loading={contentLoading && messages.length === 0} /></div><div className="border-t border-slate-900/80 bg-[#040814]/80 backdrop-blur-xl p-4"><ContentInput onSubmit={handleSubmitContent} /></div></> : <Whiteboard spaceId={roomId} password={roomPassword} />}
      </div>
    </div>
  )
}
