// lib/memory-store.ts
interface Room {
  id: string
  createdAt: number
  passwordHash?: string
  expiresAt: number
}

interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  type: "text" | "image" | "pdf" | "file"
  createdAt: number
}

class MemoryStore {
  private rooms = new Map<string, Room>()
  private messages = new Map<string, Message[]>()

  // Clean up expired rooms
  private cleanup() {
    const now = Date.now()

    for (const [roomId, room] of this.rooms.entries()) {
      if (now > room.expiresAt) {
        this.rooms.delete(roomId)
        this.messages.delete(roomId)
      }
    }
  }

  setRoom(roomId: string, room: Room) {
    this.cleanup()
    this.rooms.set(roomId, room)
  }

  getRoom(roomId: string): Room | null {
    this.cleanup()
    const room = this.rooms.get(roomId)
    if (room && Date.now() > room.expiresAt) {
      this.rooms.delete(roomId)
      this.messages.delete(roomId)
      return null
    }
    return room || null
  }

  roomExists(roomId: string): boolean {
    this.cleanup()
    const room = this.rooms.get(roomId)
    if (room && Date.now() > room.expiresAt) {
      this.rooms.delete(roomId)
      this.messages.delete(roomId)
      return false
    }
    return this.rooms.has(roomId)
  }

  addMessage(roomId: string, message: Message) {
    this.cleanup()
    if (!this.messages.has(roomId)) {
      this.messages.set(roomId, [])
    }
    this.messages.get(roomId)!.push(message)
  }

  getMessages(roomId: string): Message[] {
    this.cleanup()
    return this.messages.get(roomId) || []
  }

  getAllRooms(): string[] {
    this.cleanup()
    return Array.from(this.rooms.keys())
  }
}

// 👇 Use globalThis so store persists across reloads
const globalForMemoryStore = globalThis as unknown as {
  memoryStore?: MemoryStore
}

if (!globalForMemoryStore.memoryStore) {
  globalForMemoryStore.memoryStore = new MemoryStore()
}

export const memoryStore = globalForMemoryStore.memoryStore
