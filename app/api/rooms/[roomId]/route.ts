import { NextResponse } from "next/server"
import { hashPassword, storage, verifyPassword } from "@/lib/storage"
import type { Room } from "@/lib/types"

const durations: Record<string, number> = { "15m": 15 * 60 * 1000, "1h": 60 * 60 * 1000, "6h": 6 * 60 * 60 * 1000, "24h": 24 * 60 * 60 * 1000 }

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    console.log(`🔍 Fetching room: ${roomId}`)

    // Get the room data
    const room = await storage.getRoom(roomId)

    if (!room) {
      console.log(`❌ Room ${roomId} not found`)
      return NextResponse.json({ error: "Space not found or has expired" }, { status: 404 })
    }

    // Check if room has expired (double check timestamp)
    const now = Date.now()
    if (now > room.expiresAt) {
      console.log(`⏰ Room ${roomId} has expired`)
      return NextResponse.json({ error: "Space has expired" }, { status: 404 })
    }

    // 1. Password Protection Access Check
    if (room.passwordHash) {
      const clientPassword = request.headers.get("x-room-password")

      if (!clientPassword || !verifyPassword(clientPassword, room.passwordHash)) {
        console.log(`🔒 Room ${roomId} access denied - Password required/incorrect`)
        return NextResponse.json(
          { error: "Password required or incorrect", isPasswordProtected: true },
          { status: 401 }
        )
      }
      console.log(`🔑 Room ${roomId} password verification succeeded`)
    }

    console.log(`✅ Room ${roomId} retrieved successfully`)

    // Omit passwordHash before sending the room details to the client
    const safeRoom = { id: room.id, createdAt: room.createdAt, expiresAt: room.expiresAt }
    return NextResponse.json(safeRoom)
  } catch (error) {
    console.error(`❌ Failed to get room:`, error)
    return NextResponse.json({ error: "Failed to get space" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params
    const room = await storage.getRoom(roomId)
    if (!room || Date.now() > room.expiresAt) return NextResponse.json({ error: "Space not found or has expired" }, { status: 404 })
    const currentPassword = request.headers.get("x-room-password")
    if (room.passwordHash && (!currentPassword || !verifyPassword(currentPassword, room.passwordHash))) return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const duration = durations[body.expiry] ?? durations["24h"]
    const password = typeof body.password === "string" ? body.password.trim() : ""
    const updated: Room = { ...room, expiresAt: Date.now() + duration, ...(password ? { passwordHash: hashPassword(password) } : {}) }
    await storage.setRoom(roomId, updated)
    const safeRoom = { id: updated.id, createdAt: updated.createdAt, expiresAt: updated.expiresAt }
    return NextResponse.json(safeRoom)
  } catch {
    return NextResponse.json({ error: "Unable to update space settings." }, { status: 500 })
  }
}
