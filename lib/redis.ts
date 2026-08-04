// lib/redis.ts
import { Redis as UpstashRedis } from "@upstash/redis"
import IORedis from "ioredis"

let redis: any = null

export function getRedis() {
  if (!redis) {
    console.log("Initializing Redis client...")

    const url = process.env.KV_REST_API_URL
    const token = process.env.KV_REST_API_TOKEN
    const localUrl = process.env.REDIS_URL || "redis://localhost:6379"

    if (url && token) {
      // Use Upstash
      redis = new UpstashRedis({ url, token })
      console.log("✅ Using Upstash Redis")
    } else {
      // Fallback to local Redis
      redis = new IORedis(localUrl)
      console.log(`✅ Using local Redis at ${localUrl}`)
    }
  }

  return redis
}

export const ROOM_TTL = 24 * 60 * 60 // 24h
export const MESSAGE_TTL = 24 * 60 * 60 // 24h
