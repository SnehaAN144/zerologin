import { NextResponse } from "next/server"
import { storage, hashPassword } from "@/lib/storage"
import { generateRoomId } from "@/lib/utils"
import type { Room } from "@/lib/types"

export async function POST(request: Request) {
  try {
    console.log("🚀 Creating new room...")
    const body = await request.json().catch(() => ({}))
    const { customRoomId, password, expiry } = body

    let roomId = ""

    // 1. Validate Custom Room ID if provided
    if (customRoomId && typeof customRoomId === "string" && customRoomId.trim().length > 0) {
      const trimmedId = customRoomId.trim()

      // Validation check: Length (3 to 30 characters)
      if (trimmedId.length < 3 || trimmedId.length > 30) {
        return NextResponse.json(
          { error: "Space name must be between 3 and 30 characters long." },
          { status: 400 }
        )
      }

      // Validation check: Allowed characters (lowercase letters, numbers, hyphen, underscore)
      const validPattern = /^[a-z0-9-_]+$/
      if (!validPattern.test(trimmedId)) {
        return NextResponse.json(
          { error: "Space name can only contain lowercase letters, numbers, hyphens (-), and underscores (_)." },
          { status: 400 }
        )
      }

      // Validation check: Availability check
      const roomExists = await storage.roomExists(trimmedId)
      if (roomExists) {
        return NextResponse.json(
          { error: "This space name is already taken. Please choose another one." },
          { status: 400 }
        )
      }

      roomId = trimmedId
    } else {
      // If empty, generate a random ID
      roomId = generateRoomId()
    }

    // 2. Validate and calculate Dynamic Expiration Duration
    // Supported durations: 15 minutes ("15m"), 1 hour ("1h"), 6 hours ("6h"), 24 hours ("24h")
    let durationMs = 24 * 60 * 60 * 1000 // default 24h
    if (expiry === "15m") {
      durationMs = 15 * 60 * 1000
    } else if (expiry === "1h") {
      durationMs = 60 * 60 * 1000
    } else if (expiry === "6h") {
      durationMs = 6 * 60 * 60 * 1000
    } else if (expiry === "24h") {
      durationMs = 24 * 60 * 60 * 1000
    }

    const expiresAt = Date.now() + durationMs

    // 3. Optional Password protection setup
    let passwordHash: string | undefined = undefined
    if (password && typeof password === "string" && password.length > 0) {
      passwordHash = hashPassword(password)
    }

    const room: Room = {
      id: roomId,
      createdAt: Date.now(),
      expiresAt,
      ...(passwordHash ? { passwordHash } : {}),
    }

    console.log(`💾 Storing room ${roomId} (expires in ${durationMs / (60 * 1000)}m)...`)
    await storage.setRoom(roomId, room)

    // Verify the room was stored correctly
    console.log("🔍 Verifying room storage...")
    const storedRoom = await storage.getRoom(roomId)

    if (!storedRoom) {
      console.error("❌ Room verification failed - room not found after storage")
      return NextResponse.json({ error: "Failed to create space. Storage verification failed." }, { status: 500 })
    }

    console.log(`✅ Room ${roomId} created and verified successfully`)
    return NextResponse.json({ roomId })
  } catch (error) {
    console.error("❌ Failed to create room:", error)
    return NextResponse.json({ error: "Failed to create space. Please try again." }, { status: 500 })
  }
}

export async function GET() {
  try {
    const rooms = await storage.getAllRooms()
    return NextResponse.json({
      message: "Rooms API is working",
      storageType: storage.getStorageType(),
      activeRooms: rooms.length,
      rooms: rooms,
    })
  } catch (error) {
    console.error("❌ Failed to get rooms:", error)
    return NextResponse.json({ error: "Failed to get rooms" }, { status: 500 })
  }
}
