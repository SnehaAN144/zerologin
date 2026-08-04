import { NextResponse } from "next/server"
import { storage, verifyPassword } from "@/lib/storage"
import { generateId, generateUserId } from "@/lib/utils"
import type { Message } from "@/lib/types"

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    console.log(`📨 Fetching messages for room: ${roomId}`)

    // Check if room exists first
    const room = await storage.getRoom(roomId)
    if (!room) {
      console.log(`❌ Room ${roomId} not found`)
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // 1. Password verification check
    if (room.passwordHash) {
      const clientPassword = request.headers.get("x-room-password")
      if (!clientPassword || !verifyPassword(clientPassword, room.passwordHash)) {
        return NextResponse.json({ error: "Unauthorized access. Password required." }, { status: 401 })
      }
    }

    // Get messages
    const messages = await storage.getMessages(roomId)
    console.log(`✅ Retrieved ${messages.length} messages for room ${roomId}`)

    // Ensure we always return an array
    const validMessages = Array.isArray(messages) ? messages : []

    // Validate message structure
    const sanitizedMessages = validMessages.filter((msg) => {
      return (
        msg &&
        typeof msg === "object" &&
        msg.id &&
        msg.roomId &&
        msg.userId &&
        msg.content &&
        msg.type &&
        typeof msg.createdAt === "number"
      )
    })

    console.log(`✅ Returning ${sanitizedMessages.length} valid messages`)
    return NextResponse.json(sanitizedMessages)
  } catch (error) {
    console.error(`❌ Failed to get messages:`, error)
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    console.log(`📝 Posting message to room: ${roomId}`)

    // Check if room exists
    const room = await storage.getRoom(roomId)
    if (!room) {
      console.log(`❌ Room ${roomId} not found`)
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // 1. Password verification check
    if (room.passwordHash) {
      const clientPassword = request.headers.get("x-room-password")
      if (!clientPassword || !verifyPassword(clientPassword, room.passwordHash)) {
        return NextResponse.json({ error: "Unauthorized access. Password required." }, { status: 401 })
      }
    }

    const body = await request.json()
    const { content, type = "text", fileName, fileSize, fileType } = body

    if (!content) {
      console.log("❌ Missing content in message")
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const messageId = generateId()
    const userId = generateUserId()

    const message: Message = {
      id: messageId,
      roomId,
      userId,
      content,
      type,
      fileName,
      fileSize,
      fileType,
      createdAt: Date.now(),
    }

    console.log(`💾 Storing message ${messageId} in room ${roomId}`)
    await storage.addMessage(roomId, message)
    console.log(`✅ Message stored successfully`)

    return NextResponse.json(message)
  } catch (error) {
    console.error(`❌ Failed to create message:`, error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
