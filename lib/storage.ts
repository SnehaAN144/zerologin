import type { Room, Message } from "@/lib/types"
import { memoryStore } from "./memory-store"
import crypto from "crypto"

// Secure password hashing helper (HMAC-SHA256 with static server-side salt)
export function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_HASH_SALT || "zerologin_secure_default_salt_2026"
  return crypto.createHmac("sha256", salt).update(password).digest("hex")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

class StorageManager {
  private redis: any = null
  private useRedis = false
  private initialized = false

  private async initialize() {
    if (this.initialized) return

    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Redis } = await import("@upstash/redis")
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })

        // Test the connection
        await this.redis.ping()
        this.useRedis = true
        console.log("✅ Using Redis for storage")
      } else {
        console.log("⚠️ Redis not configured, using memory store (data will not persist across serverless invocations)")
      }
    } catch (error) {
      console.log("❌ Redis connection failed, using memory store:", error)
      this.useRedis = false
    }

    this.initialized = true
  }

  async setRoom(roomId: string, room: Room): Promise<void> {
    await this.initialize()

    if (this.useRedis && this.redis) {
      try {
        // Calculate dynamic TTL in seconds based on expiresAt timestamp
        const ttl = Math.max(1, Math.ceil((room.expiresAt - Date.now()) / 1000))
        await this.redis.set(`room:${roomId}`, room, { ex: ttl })
        console.log(`✅ Room ${roomId} stored in Redis with TTL ${ttl}s`)
        return
      } catch (error) {
        console.error("❌ Redis setRoom error:", error)
        this.useRedis = false
      }
    }

    memoryStore.setRoom(roomId, room)
    console.log(`✅ Room ${roomId} stored in memory`)
  }

  async getRoom(roomId: string): Promise<Room | null> {
    await this.initialize()

    if (this.useRedis && this.redis) {
      try {
        const data = await this.redis.get(`room:${roomId}`)
        console.log(`🔍 Redis data for room ${roomId}:`, typeof data, data)

        if (data && typeof data === "object" && data.id && data.createdAt && data.expiresAt) {
          // Check expiration
          if (Date.now() > data.expiresAt) {
            console.log(`⏰ Room ${roomId} has expired, cleaning up`)
            await this.redis.del(`room:${roomId}`)
            return null
          }
          console.log(`✅ Room ${roomId} found in Redis`)
          return data as Room
        }

        if (data) {
          console.error(`❌ Malformed room data for ${roomId}, deleting`)
          await this.redis.del(`room:${roomId}`)
        }
      } catch (error) {
        console.error("❌ Redis getRoom error:", error)
        this.useRedis = false
      }
    }

    const room = memoryStore.getRoom(roomId)
    if (room) {
      console.log(`✅ Room ${roomId} found in memory`)
    } else {
      console.log(`❌ Room ${roomId} not found`)
    }
    return room
  }

  async roomExists(roomId: string): Promise<boolean> {
    await this.initialize()

    if (this.useRedis && this.redis) {
      try {
        const exists = await this.redis.exists(`room:${roomId}`)
        if (exists > 0) {
          // Double check expiration by getting it
          const room = await this.getRoom(roomId)
          return room !== null
        }
        return false
      } catch (error) {
        console.error("❌ Redis roomExists error:", error)
        this.useRedis = false
      }
    }

    const exists = memoryStore.roomExists(roomId)
    console.log(`Room ${roomId} exists in memory: ${exists}`)
    return exists
  }

  async addMessage(roomId: string, message: Message): Promise<void> {
    await this.initialize()

    if (this.useRedis && this.redis) {
      try {
        // Message TTL should match the remaining lifetime of its room
        const room = await this.getRoom(roomId)
        const ttl = room ? Math.max(1, Math.ceil((room.expiresAt - Date.now()) / 1000)) : 24 * 60 * 60

        await this.redis.set(`message:${roomId}:${message.id}`, message, { ex: ttl })
        console.log(`✅ Message ${message.id} stored in Redis with TTL ${ttl}s`)
        return
      } catch (error) {
        console.error("❌ Redis addMessage error:", error)
        this.useRedis = false
      }
    }

    memoryStore.addMessage(roomId, message as any)
    console.log(`✅ Message ${message.id} stored in memory`)
  }

  async getMessages(roomId: string): Promise<Message[]> {
    await this.initialize()

    if (this.useRedis && this.redis) {
      try {
        const keys = await this.redis.keys(`message:${roomId}:*`)
        if (keys.length === 0) return []

        const messages = await this.redis.mget(...keys)
        const result: Message[] = []

        for (const data of messages) {
          if (data && typeof data === "object" && data.id) {
            result.push(data as Message)
          }
        }

        result.sort((a: Message, b: Message) => a.createdAt - b.createdAt)
        console.log(`✅ Found ${result.length} messages in Redis`)
        return result
      } catch (error) {
        console.error("❌ Redis getMessages error:", error)
        this.useRedis = false
      }
    }

    const messages = memoryStore.getMessages(roomId)
    console.log(`✅ Found ${messages.length} messages in memory`)
    return messages
  }

  async getAllRooms(): Promise<string[]> {
    await this.initialize()

    if (this.useRedis && this.redis) {
      try {
        const keys = await this.redis.keys("room:*")
        const activeRooms: string[] = []
        for (const key of keys) {
          const roomId = key.replace("room:", "")
          const room = await this.getRoom(roomId)
          if (room) {
            activeRooms.push(roomId)
          }
        }
        return activeRooms
      } catch (error) {
        console.error("❌ Redis getAllRooms error:", error)
        this.useRedis = false
      }
    }

    return memoryStore.getAllRooms()
  }

  async clearCorruptedData(): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        const roomKeys = await this.redis.keys("room:*")

        for (const key of roomKeys) {
          try {
            const data = await this.redis.get(key)
            if (!data || typeof data !== "object" || !data.id || !data.expiresAt) {
              console.log(`🧹 Deleting corrupted room key: ${key}`)
              await this.redis.del(key)
            }
          } catch (error) {
            console.log(`🧹 Deleting corrupted room key: ${key}`)
            await this.redis.del(key)
          }
        }
      } catch (error) {
        console.error("❌ Error clearing corrupted data:", error)
      }
    }
  }

  getStorageType(): string {
    return this.useRedis ? "Redis" : "Memory"
  }
}

export const storage = new StorageManager()
