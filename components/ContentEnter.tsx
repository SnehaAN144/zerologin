"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import FileUpload from "./FileUpload"

interface ContentInputProps {
  onSubmit: (
    content: string,
    type: "text" | "image" | "pdf" | "file",
    fileName?: string,
    fileSize?: number,
    fileType?: string,
  ) => void
}

export default function ContentInput({ onSubmit }: ContentInputProps) {
  const [text, setText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSubmit(text.trim(), "text")
      setText("")
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 0)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/uploadthing", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const { url } = await response.json()
        let fileType: "image" | "pdf" | "file" = "file"
        if (file.type.startsWith("image/")) {
          fileType = "image"
        } else if (file.type === "application/pdf") {
          fileType = "pdf"
        }
        onSubmit(url, fileType, file.name, file.size, file.type)
        setShowFileUpload(false)
      } else {
        console.error("Failed to upload file:", await response.text())
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmitText(e)
    }
  }

  return (
    <div className="md:space-y-4 bg-slate-900/40 border border-slate-900/80 md:p-4 rounded-xl">
      {showFileUpload ? (
        <div className="space-y-4">
          <FileUpload onUpload={handleFileUpload} disabled={isUploading} />
          {isUploading && (
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
              <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading file...</span>
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => setShowFileUpload(false)}
              className="text-slate-400 hover:text-cyan-400 text-sm font-medium transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitText} className="md:space-y-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full px-4 py-3 bg-black/40 backdrop-blur-sm border border-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent resize-none text-slate-100 placeholder-slate-500 text-sm"
              rows={3}
            />
          </div>
          <div className="flex justify-between items-center gap-3">
            <motion.button
              type="button"
              onClick={() => setShowFileUpload(true)}
              whileTap={{ scale: 0.95 }}
              className="flex items-center bg-[#0a1128] hover:bg-[#0f1b3d] border border-blue-500/20 hover:border-cyan-500/40 rounded-lg py-2.5 px-4 space-x-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <span className="font-semibold text-sm">Upload File</span>
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#2563EB] hover:from-[#1D4ED8] hover:via-[#2563EB] hover:to-[#1D4ED8] text-white font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,0.45)] tracking-wide px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-700/30 disabled:from-slate-800/80 disabled:to-slate-800/80 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer"
            >
              Save Content
            </motion.button>
          </div>
        </form>
      )}
    </div>
  )
}