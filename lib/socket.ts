import { io, type Socket } from "socket.io-client"

class SocketManager {
  private socket: Socket | null = null
  private token: string | null = null

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket
    }

    this.token = token
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    })

    this.setupEventHandlers()
    return this.socket
  }

  private setupEventHandlers() {
    if (!this.socket) return

    this.socket.on("connect", () => {
      console.log("Connected to server:", this.socket?.id)
    })

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason)
    })

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error)
    })

    this.socket.on("error", (error) => {
      console.error("Socket error:", error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket() {
    return this.socket
  }

  // Chat methods
  joinGroup(groupId: string) {
    this.socket?.emit("join-group", groupId)
  }

  sendMessage(data: {
    groupId: string
    userId: string
    userName: string
    userRole: string
    content: string
    messageType?: string
    fileUrl?: string
    fileName?: string
    fileSize?: number
  }) {
    this.socket?.emit("send-message", data)
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on("new-message", callback)
  }

  offNewMessage() {
    this.socket?.off("new-message")
  }

  // CAT monitoring methods
  logCatActivity(data: {
    assessmentId: string
    userId: string
    activityType: string
    details: any
    timestamp: string
  }) {
    this.socket?.emit("cat-activity", data)
  }

  onCatAlert(callback: (alert: any) => void) {
    this.socket?.on("cat-alert", callback)
  }

  // Notification methods
  onNotification(callback: (notification: any) => void) {
    this.socket?.on("notification", callback)
  }

  // Assignment methods
  onAssignmentUpdate(callback: (update: any) => void) {
    this.socket?.on("assignment-update", callback)
  }

  // Resource methods
  onResourceUpdate(callback: (update: any) => void) {
    this.socket?.on("resource-update", callback)
  }

  // User presence methods
  updatePresence(status: "online" | "away" | "offline") {
    this.socket?.emit("presence-update", { status })
  }

  onUserPresence(callback: (presence: any) => void) {
    this.socket?.on("user-presence", callback)
  }
}

export const socketManager = new SocketManager()
export default socketManager
