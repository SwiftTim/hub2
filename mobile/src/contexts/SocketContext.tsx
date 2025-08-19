"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import * as SecureStore from "expo-secure-store"
import { API_BASE_URL } from "../config"
import { useAuth } from "./AuthContext"

interface SocketContextType {
  socket: Socket | null
  connected: boolean
  joinGroup: (groupId: string) => void
  sendMessage: (data: any) => void
  onNewMessage: (callback: (message: any) => void) => void
  offNewMessage: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      connectSocket()
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [user])

  const connectSocket = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken")
      if (!token) return

      const newSocket = io(API_BASE_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
      })

      newSocket.on("connect", () => {
        console.log("Connected to server:", newSocket.id)
        setConnected(true)
      })

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server")
        setConnected(false)
      })

      newSocket.on("connect_error", (error) => {
        console.error("Connection error:", error)
        setConnected(false)
      })

      setSocket(newSocket)
    } catch (error) {
      console.error("Socket connection error:", error)
    }
  }

  const joinGroup = (groupId: string) => {
    socket?.emit("join-group", groupId)
  }

  const sendMessage = (data: any) => {
    socket?.emit("send-message", data)
  }

  const onNewMessage = (callback: (message: any) => void) => {
    socket?.on("new-message", callback)
  }

  const offNewMessage = () => {
    socket?.off("new-message")
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinGroup,
        sendMessage,
        onNewMessage,
        offNewMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
