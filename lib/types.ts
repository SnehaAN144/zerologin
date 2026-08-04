export interface Room {
  id: string
  createdAt: number
  passwordHash?: string // HMAC-SHA256 hash of optional room password
  expiresAt: number     // Absolute millisecond timestamp for when the room expires
  whiteboard?: WhiteboardElement[]
}
export interface WhiteboardElement { id: string; tool: "pencil" | "highlighter" | "eraser" | "rectangle" | "circle" | "line"; points: Array<{ x: number; y: number }>; color: string; width: number }

export interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  type: "text" | "image" | "pdf" | "file"
  fileName?: string
  fileSize?: number
  fileType?: string
  createdAt: number
}

export type FileType = "image" | "pdf" | "file"
